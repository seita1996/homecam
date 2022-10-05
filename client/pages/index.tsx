import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import styles from '../styles/Home.module.css'
import { publicIpv4 } from 'public-ip'

const Compression = function() {
  const Buffer = require('buffer').Buffer
  const zlib = require('zlib')

  return {
    gzip: function(str: string){
        const content = encodeURIComponent(str)
        const result = zlib.gzipSync(content)
        const value = result.toString('base64')
        return value
    },
    unzip: function(value: string){
        const buffer = Buffer.from(value, 'base64')
        const result = zlib.unzipSync(buffer)
        const str = decodeURIComponent(result).toString() // Add 'utf-8' argument if necessary
        return str
    }
  }
}

const P2P = function({ remoteVideoId = '', displaySdpId = '' }) {
  let peerConnection: RTCPeerConnection

  return {
    sdp: '',
    // 対象のHTMLエレメントに対してMediaStreamを反映
    playVideo: function(element: HTMLMediaElement, stream: MediaStream) {
      console.log('playVideo')
      if ('srcObject' in element) {
        if (! element.srcObject) {
          element.srcObject = stream
        } else {
          console.log('stream alreay playing, so skip')
        }
      }
      element.play()
      element.volume = 0
    },

    // デバイスのカメラをオフ
    pauseVideo: function(element: HTMLMediaElement) {
      element.pause()
      if ('srcObject' in element) {
        element.srcObject = null
      }
      else {
        if (element.src && (element.src !== '') ) {
          window.URL.revokeObjectURL(element.src)
        }
        element.src = ''
      }
    },

    // Streamを中断
    stopLocalStream: function(stream: MediaStream) {
      let tracks = stream.getTracks()
      if (! tracks) {
        console.warn('NO tracks')
        return
      }
      for (let track of tracks) {
        track.stop()
      }
    },

    setRemoteDescriptionOfferAnswer: function(sdpText: string, stream: MediaStream) {
      if (peerConnection) {
        console.log('Received answer text...')
        let answer = new RTCSessionDescription({
          type : 'answer',
          sdp : sdpText,
        })
        this.setAnswer(answer)
      }
      else {
        console.log('Received offer text...')
        let offer = new RTCSessionDescription({
          type : 'offer',
          sdp : sdpText,
        })
        this.setOffer(offer, stream)
      }
    },

    setAnswer: function(sessionDescription: RTCSessionDescription) {
      if (! peerConnection) {
        console.error('peerConnection NOT exist!')
        return
      }
      peerConnection.setRemoteDescription(sessionDescription)
      .then(function() {
        console.log('setRemoteDescription(answer) succsess in promise')
      }).catch(function(err) {
        console.error('setRemoteDescription(answer) ERROR: ', err)
      })
    },

    setOffer: function(sessionDescription: RTCSessionDescription, stream: MediaStream) {
      if (peerConnection) {
        console.error('peerConnection alreay exist!')
      }
      peerConnection = this.prepareNewConnection(stream)
      const _this = this
      peerConnection.setRemoteDescription(sessionDescription)
      .then(function() {
        console.log('setRemoteDescription(offer) succsess in promise')
        _this.makeAnswer(stream)
      }).catch(function(err) {
        console.error('setRemoteDescription(offer) ERROR: ', err)
      })
    },

    makeAnswer: function(stream: MediaStream) {
      console.log('sending Answer. Creating remote session description...' )
      if (! peerConnection) {
        console.error('peerConnection NOT exist!')
        return
      }
      let options = {}
      if (! stream) {
        //options = { offerToReceiveAudio: true, offerToReceiveVideo: true }

        if ('addTransceiver' in peerConnection) {
          console.log('-- use addTransceiver() for recvonly --')
          peerConnection.addTransceiver('video', { direction: 'recvonly' })
          peerConnection.addTransceiver('audio', { direction: 'recvonly' })
        }
      }
      peerConnection.createAnswer(options)
      .then(function (sessionDescription) {
        console.log('createAnswer() succsess in promise')
        return peerConnection.setLocalDescription(sessionDescription)
      }).then(function() {
        console.log('setLocalDescription() succsess in promise')
      }).catch(function(err) {
        console.error(err)
      })
    },

    makeOffer: function(stream: MediaStream) {
      if (peerConnection) {
        console.warn('peer already exist.')
        return
      }
      peerConnection = this.prepareNewConnection(stream)

      let options = {}
      peerConnection.createOffer(options)
      .then(function (sessionDescription) {
        console.log('createOffer() succsess in promise')
        return peerConnection.setLocalDescription(sessionDescription)
      }).then(function() {
        console.log('setLocalDescription() succsess in promise')
      }).catch(function(err) {
        console.error(err)
      })
    },

    prepareNewConnection: function(stream: MediaStream) {
      let pc_config = {"iceServers":[]}
      let peer = new RTCPeerConnection(pc_config)
      // --- on get remote stream ---
      const _this = this
      if ('ontrack' in peer) {
        peer.ontrack = function(event) {
          console.log('-- peer.ontrack()')
          let stream = event.streams[0]
          const remoteVideo = document.getElementById(remoteVideoId) as HTMLVideoElement
          _this.playVideo(remoteVideo, stream)
          if (event.streams.length > 1) {
            console.warn('got multi-stream, but play only 1 stream')
          }
        }
      }
      // --- on get local ICE candidate
      peer.onicecandidate = function (evt) {
        if (evt.candidate) {
          console.log(evt.candidate)
          // Trickle ICE の場合は、ICE candidateを相手に送る
          // Vanilla ICE の場合には、何もしない
        } else {
          console.log('empty ice event')
          // Trickle ICE の場合は、何もしない
          // Vanilla ICE の場合には、ICE candidateを含んだSDPを相手に送る
          _this.displaySdp(peer.localDescription as RTCSessionDescription)
        }
      }
      // -- add local stream --
      if (stream) {
        console.log('Adding local stream...')
        if ('addTrack' in peer) {
          console.log('use addTrack()')
          let tracks = stream.getTracks()
          for (let track of tracks) {
            let sender = peer.addTrack(track, stream)
          }
        }
      }
      else {
        console.warn('no local stream, but continue.')
      }

      return peer
    },

    displaySdp: function(sessionDescription: RTCSessionDescription) {
      console.log('---sending sdp ---')
      const textForDisplaySdp: HTMLTextAreaElement = document.getElementById(displaySdpId) as HTMLTextAreaElement
      textForDisplaySdp.value = sessionDescription.sdp
      textForDisplaySdp.focus()
      textForDisplaySdp.select()

      this.sdp = sessionDescription.sdp
      // console.log('sdp', sdp)
    }
  }
}

const Home: NextPage = () => {
  let localStream: MediaStream

  const p2p = P2P({ remoteVideoId: 'remoteVideo', displaySdpId: 'text_for_display_sdp' })
  const compression = Compression()

  const socketRef = useRef<WebSocket>()
  const [isConnected, setIsConnected] = useState(false)
  const [nameList, setNameList] = useState<object[]>([])
  const [myName, setMyName] = useState('')

  useEffect(() => {
    (async () => {
      // IPv4 address cannot be obtained for IPoE connection, so it is sent after obtaining it with Client.
      const ipv4 = await publicIpv4()
      console.log('global ipv4 address', ipv4)
      socketRef.current = new WebSocket(`${process.env.NEXT_PUBLIC_WEBSOCKET_SERVER_URL}/ws?ipv4=${ipv4}`)
      console.log(socketRef)
      socketRef.current.onopen = function() {
        setIsConnected(true)
        console.log('Connected')
      }
      socketRef.current.onmessage = function(event) {
        // Executed only when connection is Open
        // https://developer.mozilla.org/ja/docs/Web/API/WebSocket/readyState
        if(socketRef.current?.readyState === 1) {
          const resData = JSON.parse(event.data)
          if(resData.type === 'healthcheck' && resData.data === 'ping') {
            socketRef.current?.send('{ "type": "healthcheck", "data": "pong", "target": "" }')
          }
          else if(resData.type === 'yourname') {
            console.log('yourname', resData.data)
            setMyName(resData.data)
          }
          else if(resData.type === 'namelist') {
            setNameList([...nameList, ...resData.data])
          }
          else if(resData.type === 'sdp') {
            const resSdp = compression.unzip(resData.data)
            onReceiveSdp(resSdp, resData.from)
          }
        }
      }
      socketRef.current.onclose = function() {
        setIsConnected(false)
        console.log('Closed')
      }
    })()
  }, [])

  // 自身のデバイスのカメラをオンにしてvideoタグ内へ映像を反映
  async function startVideo() {
    console.log('startVideo')
    const localVideo = document.getElementById('localVideo') as HTMLVideoElement
    localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: false})
    p2p.playVideo(localVideo, localStream)
  }

  // 自身のデバイスのカメラをオフにしてStreamを中断
  function stopVideo() {
    console.log('stopVideo')
    const localVideo = document.getElementById('localVideo') as HTMLVideoElement
    p2p.pauseVideo(localVideo)
    p2p.stopLocalStream(localStream)
  }

  // Start PeerConnection
  function connect() {
    console.log('connect')
    console.log('make Offer')
    p2p.makeOffer(localStream)
  }
  function hangup() {
    console.log('hangup')
  }

  function onSdpText() {
    const textToReceiveSdp = document.getElementById('text_for_receive_sdp') as HTMLTextAreaElement
    let text = textToReceiveSdp.value
    text = _trimTailDoubleLF(text); // for Safar TP --> Chrome
    p2p.setRemoteDescriptionOfferAnswer(text, localStream)
    textToReceiveSdp.value =''
  }

  async function onReceiveSdp(resSdp: string, from: string) {
    if (from !== '') {
      // Outbound trip
      await startVideo()
      sendSdp(from, '')
      p2p.setRemoteDescriptionOfferAnswer(resSdp, localStream)
    } else {
      // Return trip
      const textToReceiveSdp = document.getElementById('text_for_receive_sdp') as HTMLTextAreaElement
      textToReceiveSdp.value = resSdp
    }
  }

  function _trimTailDoubleLF(str: string) {
    const trimed = str.trim()
    return trimed + String.fromCharCode(13, 10)
  }

  async function startExchangeSDP(targetClientName: string) {
    if (targetClientName === myName) {
      // TODO: Launch Settings Modal
      console.error('×startExchangeSDP')
      return
    }
    console.log('startExchangeSDP')
    // start video
    await startVideo()
    // connect
    connect()
    // send sdp
    sendSdp(targetClientName, myName)
  }

  function sendSdp(targetClientName: string, fromClientName: string) {
    let previousValue = p2p.sdp
    const observe = function() {
      const value = p2p.sdp
      if(previousValue === value) return
      if(socketRef.current?.readyState === 1) {
        // Send value to Peer when SDP value is set
        socketRef.current?.send(`{ "type": "sdp", "data": "${compression.gzip(p2p.sdp)}", "target": "${targetClientName}", "from": "${fromClientName}" }`)
      }
      previousValue = p2p.sdp
    }
    setInterval(observe, 500)
  }

  function decorateClientName(clientName: string) {
    if (clientName === myName) {
      return clientName + '(me)'
    }
    return clientName
  }

  function displayClientList(list: any) {
    return list.map(function (clientName: string, i: number) {
      return <div key={`clientName${i}`} className={styles.btn} onClick={() => startExchangeSDP(clientName)}>{decorateClientName(clientName)}</div>
    })
  }

  return (
    <div>
      <Head>
        <title>homecam</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.title}>homecam</div>
      <div>
        <button onClick={startVideo}>Start Video</button>
        <button onClick={stopVideo}>Stop Video</button>
        <button onClick={connect}>Connect</button>
        <button onClick={hangup}>Hang Up</button>
      </div>
      <div>
        <video id="localVideo" className={styles.videoBox} muted autoPlay playsInline></video>
        <video id="remoteVideo" className={styles.videoBox} muted autoPlay playsInline></video>
      </div>
      <div>
        <p>SDP to send:&nbsp;
          <button type="button">copy local SDP</button><br />
          <textarea id="text_for_display_sdp" rows={5} cols={60} readOnly={true}>SDP to send</textarea>
        </p>
        <p>SDP to receive:&nbsp;
          <button type="button" onClick={onSdpText}>Receive remote SDP</button><br />
          <textarea id="text_for_receive_sdp" rows={5} cols={60}></textarea>
        </p>
      </div>
      <div>
        <span>WebSocket is connected : {`${isConnected}`}</span>
      </div>
      <div>
        <span>Room List</span>
        <div className={styles.flexSpaceAround}>
          { displayClientList(nameList) }
        </div>
      </div>
      <Link href='/terms'>Terms</Link>
    </div>
  )
}

export default Home
