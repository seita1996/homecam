import { connect } from 'http2'
import type { NextPage } from 'next'
import Head from 'next/head'
import styles from '../styles/Sender.module.css'
import React, { useEffect, useState } from 'react'
import MyText from '../components/mytext'

const Sender: NextPage = () => {
  // let canditates = [] as RTCIceCandidate[];
  const [canditates, setCanditates] = useState<RTCIceCandidate[]>([]);
  // let offer: RTCSessionDescriptionInit;
  const [offer, setOffer] = useState<RTCSessionDescriptionInit>();

  useEffect(() => {
    connectPeers()
  }, [])

  async function connectPeers() {
    if(typeof window === 'undefined') {
      return // Server sideでは実行しない
    }

    const config = {
      offerToReceiveAudio: 1,
      offerToReceiveVideo: 0,
      iceServers: [{
        urls: 'stun:stun.l.google.com:19302'
      }]
    }

    const connection = new RTCPeerConnection(config)

    const channel = connection.createDataChannel('channel')
    // channel.onmessage = e => { receivedMessages.push(e.data) }
    // channel.onopen = e => { channelOpen = true }
    // channel.onclose = e => { channelOpen = false }

    // setLocalDescriptionが呼ばれるとICE Candidatesが生成され発火
    connection.onicecandidate = e => {
      if (e.candidate) {
        setCanditates([...canditates, e.candidate])
        // canditates.push(e.candidate)
        console.log('canditates', canditates)
      }
    }

    let localMediaStream: MediaStream
    try {
      localMediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 8 }
        },
        audio: false
      })
      localMediaStream.getTracks().forEach(track => connection.addTrack(track, localMediaStream))
      const localVideo = document.getElementById('localVideo') as HTMLVideoElement
      if(localVideo !== null) {
        localVideo.srcObject = localMediaStream
      }
    } catch (e) {
      console.log(e)
    }

    connection.createOffer().then(offerSDP => {
      connection.setLocalDescription(offerSDP) // ICE Candidates生成
      setOffer(offerSDP)
      // offer = offerSDP
      console.log('offer', offerSDP)
    })

    console.log('finish connectPeers')
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
