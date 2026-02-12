import { prisma } from '../lib/prisma'
import * as bcrypt from 'bcryptjs'

async function testAuth() {
  try {
    console.log('🔍 인증 테스트 시작...\n')
    
    // 관리자 계정 확인
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@pentasecurity.com' }
    })
    
    if (!admin) {
      console.error('❌ 관리자 계정을 찾을 수 없습니다')
      process.exit(1)
    }
    
    console.log('✅ 관리자 계정 확인:', admin.email)
    
    // 비밀번호 검증 테스트
    if (!admin.password) {
      console.log('⚠️  관리자 계정에 비밀번호가 설정되어 있지 않습니다.')
      return
    }
    const testPassword = 'admin123'
    const isValid = await bcrypt.compare(testPassword, admin.password)
    
    if (isValid) {
      console.log('✅ 비밀번호 검증 성공')
    } else {
      console.error('❌ 비밀번호 검증 실패')
      process.exit(1)
    }
    
    // 회원 계정 확인
    const member = await prisma.user.findUnique({
      where: { email: 'member@pentasecurity.com' }
    })
    
    if (!member) {
      console.error('❌ 회원 계정을 찾을 수 없습니다')
      process.exit(1)
    }
    
    console.log('✅ 회원 계정 확인:', member.email)
    
    if (!member.password) {
      console.log('⚠️  회원 계정에 비밀번호가 설정되어 있지 않습니다.')
      return
    }
    const memberPassword = 'member123'
    const memberIsValid = await bcrypt.compare(memberPassword, member.password)
    
    if (memberIsValid) {
      console.log('✅ 회원 비밀번호 검증 성공')
    } else {
      console.error('❌ 회원 비밀번호 검증 실패')
      process.exit(1)
    }
    
    console.log('\n🎉 인증 테스트 통과!')
    console.log('\n📝 테스트 계정 정보:')
    console.log('   관리자: admin@pentasecurity.com / ***')
    console.log('   회원: member@pentasecurity.com / ***')
    
  } catch (error) {
    console.error('❌ 에러 발생:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testAuth()

