/**
 * 동영상 파일에서 프레임을 캡처해 JPEG Blob으로 반환 (클라이언트 전용).
 *
 * 첫 프레임은 검은 화면인 경우가 잦으므로 기본 1초 지점을 캡처한다.
 * 영상이 짧으면 duration/2 지점으로 보정한다.
 */
export async function captureVideoFrame(file: File, atSeconds = 1): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true
    video.src = objectUrl

    let settled = false

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl)
      video.removeAttribute('src')
      video.load()
    }

    const fail = (message: string) => {
      if (settled) return
      settled = true
      cleanup()
      reject(new Error(message))
    }

    const drawAndResolve = () => {
      if (settled) return
      const width = video.videoWidth
      const height = video.videoHeight
      if (!width || !height) {
        fail('동영상 크기를 읽을 수 없습니다.')
        return
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        fail('canvas 컨텍스트를 생성할 수 없습니다.')
        return
      }
      try {
        ctx.drawImage(video, 0, 0, width, height)
      } catch {
        fail('프레임을 그리지 못했습니다.')
        return
      }
      canvas.toBlob(
        (blob) => {
          if (blob) {
            settled = true
            cleanup()
            resolve(blob)
          } else {
            fail('프레임을 이미지로 변환하지 못했습니다.')
          }
        },
        'image/jpeg',
        0.85
      )
    }

    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0
      // 1초 지점, 단 영상이 짧으면 중간 지점으로 보정
      const target = duration > 0 ? Math.min(atSeconds, duration / 2) : atSeconds
      try {
        video.currentTime = target
      } catch {
        // 시킹 불가 시 현재 프레임이라도 캡처
        drawAndResolve()
      }
    }

    video.onseeked = () => drawAndResolve()
    video.onerror = () => fail('동영상을 불러오지 못했습니다.')
  })
}
