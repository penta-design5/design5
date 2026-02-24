import B2 from 'backblaze-b2'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// .env 파일 로드 (각각 별도로 읽어서 둘 다 확인)
const envLocal = dotenv.config({ path: resolve(process.cwd(), '.env.local') }).parsed || {}
const envGlobal = dotenv.config({ path: resolve(process.cwd(), '.env') }).parsed || {}

// process.env에도 로드 (기존 방식 유지)
dotenv.config({ path: resolve(process.cwd(), '.env.local') })
dotenv.config({ path: resolve(process.cwd(), '.env') })

const b2 = new B2({
  applicationKeyId: process.env.B2_APPLICATION_KEY_ID || '',
  applicationKey: process.env.B2_APPLICATION_KEY || '',
})

async function setupCORS() {
  try {
    console.log('B2 인증 중...')
    // 인증
    const authData = await b2.authorize()
    console.log('인증 성공!')

    const bucketId = process.env.B2_BUCKET_ID
    const bucketName = process.env.B2_BUCKET_NAME

    if (!bucketId || !bucketName) {
      throw new Error('B2_BUCKET_ID 또는 B2_BUCKET_NAME이 환경 변수에 설정되지 않았습니다.')
    }

    console.log(`버킷 정보: ${bucketName} (ID: ${bucketId})`)

    // 버킷 타입은 환경 변수에서 가져오거나 기본값 사용
    // 일반적으로 'allPublic' 또는 'allPrivate'이지만, CORS 업데이트만 하려면 생략 가능
    const bucketType = process.env.B2_BUCKET_TYPE || 'allPublic'
    console.log(`버킷 타입: ${bucketType} (환경 변수 또는 기본값)`)

    // CORS 규칙 설정 (중복 제거)
    const allowedOrigins = new Set<string>(['http://localhost:3000'])

    // 프로덕션 도메인: Presigned 직접 업로드 시 layerary.com에서 CORS 허용 (모든 카테고리 업로드 대응)
    const productionOrigins = [
      'https://layerary.com',
      'https://www.layerary.com',
    ]
    productionOrigins.forEach((origin) => {
      allowedOrigins.add(origin)
      console.log(`프로덕션 도메인 추가: ${origin}`)
    })

    // B2_CORS_ORIGINS(쉼표 구분)로 추가 출처 지정 가능
    const extraOrigins = process.env.B2_CORS_ORIGINS
    if (extraOrigins) {
      extraOrigins.split(',').forEach((raw) => {
        const origin = raw.trim()
        if (origin) {
          allowedOrigins.add(origin)
          console.log(`추가 출처(B2_CORS_ORIGINS): ${origin}`)
        }
      })
    }

    // .env.local에서 읽기 (로컬 개발용)
    const localUrl = envLocal.NEXT_PUBLIC_APP_URL
    if (localUrl) {
      try {
        const localOrigin = new URL(localUrl).origin
        if (localOrigin !== 'http://localhost:3000') {
          allowedOrigins.add(localOrigin)
          console.log(`로컬 환경 변수에서 도메인 추가: ${localOrigin}`)
        }
      } catch {
        // URL 파싱 실패 시 무시
      }
    }
    
    // .env에서 읽기 (프로덕션용)
    const globalUrl = envGlobal.NEXT_PUBLIC_APP_URL
    if (globalUrl) {
      try {
        const globalOrigin = new URL(globalUrl).origin
        if (globalOrigin !== 'http://localhost:3000') {
          allowedOrigins.add(globalOrigin)
          console.log(`전역 환경 변수에서 도메인 추가: ${globalOrigin}`)
        }
      } catch {
        // URL 파싱 실패 시 무시
      }
    }
    
    // VERCEL_URL도 확인
    if (process.env.VERCEL_URL) {
      const vercelOrigin = `https://${process.env.VERCEL_URL}`
      allowedOrigins.add(vercelOrigin)
      console.log(`Vercel URL에서 도메인 추가: ${vercelOrigin}`)
    }
    
    // NEXT_PUBLIC_APP_URL이 프로덕션 URL이 아니어도 layerary.com은 위에서 이미 포함됨
    if (allowedOrigins.size <= 2) {
      console.warn('⚠️  추가 출처가 없습니다. 필요 시 .env에 NEXT_PUBLIC_APP_URL 또는 B2_CORS_ORIGINS를 설정하세요.')
    }
    
    // Set을 배열로 변환
    const allowedOriginsArray = Array.from(allowedOrigins)

    const corsRules = [
      {
        corsRuleName: 'allow-uploads',
        allowedOrigins: allowedOriginsArray,
        allowedOperations: ['b2_upload_file'],
        allowedHeaders: ['*'], // 와일드카드 사용 - 모든 헤더 허용
        exposeHeaders: [
          'x-bz-file-id',
          'x-bz-file-name',
          'x-bz-content-sha1',
          'x-bz-upload-timestamp',
        ],
        maxAgeSeconds: 3600,
      },
    ]

    console.log('\n설정할 CORS 규칙:')
    console.log(JSON.stringify(corsRules, null, 2))

    // 버킷 업데이트
    console.log('\n버킷 CORS 규칙 업데이트 중...')
    console.log('참고: bucketType을 명시적으로 포함하여 CORS 규칙을 업데이트합니다.')
    
    // bucketType을 명시적으로 포함 (같은 타입을 유지하면서 CORS 규칙 업데이트)
    // Private 버킷이므로 allPrivate로 명시 (타입 변경이 아니므로 결제 이력 불필요)
    const updateParams: any = {
      bucketId: bucketId,
      bucketType: 'allPrivate', // Private 버킷이므로 allPrivate 명시
      corsRules: corsRules,
    }
    
    console.log('\n📤 전송할 파라미터:')
    console.log(JSON.stringify(updateParams, null, 2))
    
    try {
      // B2 SDK가 corsRules를 제대로 처리하지 않을 수 있으므로
      // B2 API를 직접 호출하는 방식으로 시도
      const authData = await b2.authorize()
      const apiUrl = authData.data.apiUrl
      const authorizationToken = authData.data.authorizationToken
      
      console.log('\n🔄 B2 API를 직접 호출하여 CORS 규칙을 설정합니다...')
      
      // B2 API 직접 호출 (Node.js 내장 fetch 사용)
      const directApiResponse = await fetch(`${apiUrl}/b2api/v2/b2_update_bucket`, {
        method: 'POST',
        headers: {
          'Authorization': authorizationToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: authData.data.accountId,
          bucketId: bucketId,
          bucketType: 'allPrivate',
          corsRules: corsRules,
        }),
      })
      
      if (!directApiResponse.ok) {
        const errorText = await directApiResponse.text()
        throw new Error(`B2 API 호출 실패: ${directApiResponse.status} ${errorText}`)
      }
      
      const directApiData = await directApiResponse.json()
      const updateResult = { data: directApiData }
      
      // 응답에서 실제 설정된 CORS 규칙 확인
      console.log('\n📋 B2 API 응답:')
      if (updateResult.data) {
        console.log(JSON.stringify(updateResult.data, null, 2))
        
        // corsRules가 응답에 포함되어 있으면 출력
        if (updateResult.data.corsRules) {
          if (updateResult.data.corsRules.length === 0) {
            console.log('\n⚠️  경고: CORS 규칙이 빈 배열로 반환되었습니다!')
            console.log('   이는 CORS 규칙이 실제로 설정되지 않았을 수 있습니다.')
            console.log('   B2 API가 corsRules만으로는 업데이트를 적용하지 않을 수 있습니다.')
            console.log('\n💡 해결 방법:')
            console.log('   1. B2 웹 콘솔에서 직접 CORS 규칙을 설정해보세요.')
            console.log('   2. 또는 bucketType을 명시적으로 포함하여 다시 시도해보세요.')
            console.log('      (단, Private 버킷을 Public으로 변경하려면 결제 이력이 필요합니다)')
          } else {
            console.log('\n✅ 실제 설정된 CORS 규칙:')
            console.log(JSON.stringify(updateResult.data.corsRules, null, 2))
            console.log('\n✅ CORS 규칙이 성공적으로 업데이트되었습니다!')
          }
        } else {
          console.log('\n⚠️  경고: 응답에 corsRules 필드가 없습니다.')
        }
      }
      
      console.log('\n⚠️  변경 사항이 적용되는 데 약 10분 정도 소요될 수 있습니다.')
      console.log('\n설정된 허용 출처:')
      allowedOriginsArray.forEach((origin) => {
        console.log(`  - ${origin}`)
      })
    } catch (updateError: any) {
      // 에러 발생 시 상세 정보 출력
      console.error('\n❌ CORS 규칙 업데이트 실패:')
      if (updateError.response?.data) {
        console.error('응답 데이터:', JSON.stringify(updateError.response.data, null, 2))
      } else {
        console.error('에러 메시지:', updateError.message)
      }
      throw updateError
    }
  } catch (error: any) {
    console.error('\n❌ CORS 설정 중 오류 발생:')
    if (error.response?.data) {
      console.error('응답 데이터:', JSON.stringify(error.response.data, null, 2))
    } else {
      console.error('에러 메시지:', error.message)
    }
    if (error.stack) {
      console.error('스택 트레이스:', error.stack)
    }
    process.exit(1)
  }
}

setupCORS()

