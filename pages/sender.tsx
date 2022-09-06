import { connect } from 'http2'
import type { NextPage } from 'next'
import Head from 'next/head'
import styles from '../styles/Sender.module.css'
import React, { useEffect, useState } from 'react'
import MyText from '../components/mytext'
import { element } from 'prop-types'

const Sender: NextPage = () => {
  // let canditates = [] as RTCIceCandidate[];
  const [canditates, setCanditates] = useState<RTCIceCandidate[]>([]);
  // let offer: RTCSessionDescriptionInit;
  const [offer, setOffer] = useState<RTCSessionDescriptionInit>();

  // useEffect(() => {
  //   connectPeers()
  // }, [])

  // async function connectPeers() {
  //   if(typeof window === 'undefined') {
  //     return // Server sideでは実行しない
  //   }

  //   const config = {
  //     offerToReceiveAudio: 1,
  //     offerToReceiveVideo: 0,
  //     iceServers: [{
  //       urls: 'stun:stun.l.google.com:19302'
  //     }]
  //   }

  //   const connection = new RTCPeerConnection(config)

  //   const channel = connection.createDataChannel('channel')
  //   // channel.onmessage = e => { receivedMessages.push(e.data) }
  //   // channel.onopen = e => { channelOpen = true }
  //   // channel.onclose = e => { channelOpen = false }

  //   // setLocalDescriptionが呼ばれるとICE Candidatesが生成され発火
  //   connection.onicecandidate = e => {
  //     if (e.candidate) {
  //       setCanditates([...canditates, e.candidate])
  //       // canditates.push(e.candidate)
  //       console.log('canditates', canditates)
  //     }
  //   }

  //   let localMediaStream: MediaStream
  //   try {
  //     localMediaStream = await navigator.mediaDevices.getUserMedia({
  //       video: {
  //         width: { ideal: 1280 },
  //         height: { ideal: 720 },
  //         frameRate: { ideal: 8 }
  //       },
  //       audio: false
  //     })
  //     localMediaStream.getTracks().forEach(track => connection.addTrack(track, localMediaStream))
  //     const localVideo = document.getElementById('localVideo') as HTMLVideoElement
  //     if(localVideo !== null) {
  //       localVideo.srcObject = localMediaStream
  //     }
  //   } catch (e) {
  //     console.log(e)
  //   }

  //   connection.createOffer().then(offerSDP => {
  //     connection.setLocalDescription(offerSDP) // ICE Candidates生成
  //     setOffer(offerSDP)
  //     // offer = offerSDP
  //     console.log('offer', offerSDP)
  //   })

  //   console.log('finish connectPeers')
  // }

  let localStream: MediaStream

  async function startVideo() {
    console.log('startVideo')
    const localVideo = document.getElementById('localVideo') as HTMLVideoElement
    localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: false})
    playVideo(localVideo, localStream)
  }
  function stopVideo() {
    console.log('stopVideo')
    const localVideo = document.getElementById('localVideo') as HTMLVideoElement
    pauseVideo(localVideo)
    stopLocalStream(localStream)
  }
  function connect() {
    console.log('connect')
  }
  function hangup() {
    console.log('hangup')
  }

  function playVideo(element: HTMLMediaElement, stream: MediaStream) {
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
  }
  function pauseVideo(element: HTMLMediaElement) {
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
  }
  function stopLocalStream(stream: MediaStream) {
    let tracks = stream.getTracks()
    if (! tracks) {
      console.warn('NO tracks')
      return
    }
    for (let track of tracks) {
      track.stop()
    }
  }

  const title: string = "title"
  const description: string = "description"

  return (
    <div>
      <Head>
        <title>homecam</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      Sender
      <div>
        <button onClick={startVideo}>Start Video</button>
        <button onClick={stopVideo}>Stop Video</button>
        <button onClick={connect}>Connect</button>
        <button onClick={hangup}>Hang Up</button>
      </div>
      <div>
        <video id="localVideo" className={styles.videoBox} muted autoPlay playsInline></video>
      </div>
      <div>
        <MyText
          title={"offer"}
          description={JSON.stringify(offer)}
        />
        <MyText
          title={"canditates"}
          description={JSON.stringify(canditates)}
        />
      </div>
    </div>
  )
}

export default Sender
