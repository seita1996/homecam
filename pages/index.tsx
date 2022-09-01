import type { NextPage } from 'next'
import Head from 'next/head'
import styles from '../styles/Home.module.css'

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>homecam</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div>
        <video id="localVideo" className={styles.videoBox} muted autoPlay playsInline></video>
      </div>
    </div>
  )
}

export default Home
