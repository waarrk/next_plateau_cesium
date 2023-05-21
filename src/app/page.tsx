'use client'
import Head from 'next/head'
import dynamic from 'next/dynamic'

const Cesium = dynamic(
  () => import('../components/Cesium'),
  { ssr: false }
)

export default function Home() {
  return (
    <div>
      <Cesium />
    </div>
  )
}
