'use client'

import './styles.css'
import { Carousel } from 'acme-carousel'

export default function Gallery() {
  // 예제용 이미지 목록 (public/images에 파일을 두거나 외부 URL 사용)
  const items = [
    { src: 'https://picsum.photos/id/1015/800/600', alt: 'Landscape 1' },
    { src: 'https://picsum.photos/id/1016/800/600', alt: 'Landscape 2' },
    { src: 'https://picsum.photos/id/1018/800/600', alt: 'Landscape 3' },
  ]

  return (
    <Carousel
      items={items}
    />
  )
}
