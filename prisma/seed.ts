import { PrismaClient, UserRole, CategoryType } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // 관리자 사용자 생성
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pentasecurity.com' },
    update: {},
    create: {
      email: 'admin@pentasecurity.com',
      name: '관리자',
      password: adminPassword,
      role: UserRole.ADMIN,
    },
  })
  console.log('✅ Admin user created:', admin.email)

  // 테스트 회원 생성
  const memberPassword = await bcrypt.hash('member123', 10)
  const member = await prisma.user.upsert({
    where: { email: 'member@pentasecurity.com' },
    update: {},
    create: {
      email: 'member@pentasecurity.com',
      name: '테스트 회원',
      password: memberPassword,
      role: UserRole.MEMBER,
    },
  })
  console.log('✅ Member user created:', member.email)

  // 카테고리 생성
  const categories = [
    // WORK 카테고리
    {
      name: 'Penta Design',
      slug: 'penta-design',
      type: CategoryType.WORK,
      order: 1,
      description: '기 제작된 디자인 산출물',
    },
    {
      name: '디자인 의뢰',
      slug: 'design-request',
      type: CategoryType.WORK,
      pageType: 'design-request',
      order: 2,
      description: '디자인 의뢰 게시판',
    },
    // SOURCE 카테고리
    {
      name: 'CI/BI',
      slug: 'ci-bi',
      type: CategoryType.SOURCE,
      pageType: 'ci-bi',
      order: 1,
      description: 'CI/BI 벡터 이미지',
      config: {
        allowedTypes: ['CI', 'BI'],
      },
    },
    {
      name: 'ICON',
      slug: 'icon',
      type: CategoryType.SOURCE,
      pageType: 'icon',
      order: 2,
      description: '아이콘 벡터 이미지',
    },
    {
      name: '캐릭터',
      slug: 'character',
      type: CategoryType.SOURCE,
      pageType: 'character',
      order: 3,
      description: '캐릭터 벡터 이미지',
    },
    {
      name: '다이어그램',
      slug: 'diagram',
      type: CategoryType.SOURCE,
      order: 4,
      description: '다이어그램 벡터 이미지',
    },
    // TEMPLATE 카테고리
    {
      name: 'PPT',
      slug: 'ppt',
      type: CategoryType.TEMPLATE,
      pageType: 'ppt',
      order: 1,
      description: 'PPT 템플릿',
    },
    {
      name: '바탕화면',
      slug: 'wallpaper',
      type: CategoryType.TEMPLATE,
      pageType: 'desktop',
      order: 2,
      description: '바탕화면 템플릿',
    },
    {
      name: '웰컴보드',
      slug: 'welcome-board',
      type: CategoryType.TEMPLATE,
      pageType: 'welcomeboard',
      order: 3,
      description: '웰컴보드 템플릿',
    },
    {
      name: '감사/연말 카드',
      slug: 'card',
      type: CategoryType.TEMPLATE,
      pageType: 'card',
      order: 4,
      description: '감사/연말 카드 템플릿',
    },
    {
      name: 'eDM Code Generator',
      slug: 'edm',
      type: CategoryType.TEMPLATE,
      pageType: 'edm',
      order: 5,
      description: 'eDM HTML 코드 생성',
    },
    // BROCHURE 카테고리
    {
      name: 'WAPPLES',
      slug: 'wapples',
      type: CategoryType.BROCHURE,
      pageType: 'wapples',
      order: 1,
      description: 'WAPPLES 제품 브로셔',
    },
    {
      name: 'D.AMO',
      slug: 'damo',
      type: CategoryType.BROCHURE,
      pageType: 'damo',
      order: 2,
      description: 'D.AMO 제품 브로셔',
    },
    {
      name: 'iSIGN',
      slug: 'isign',
      type: CategoryType.BROCHURE,
      pageType: 'isign',
      order: 3,
      description: 'iSIGN 제품 브로셔',
    },
    {
      name: 'Cloudbric',
      slug: 'cloudbric',
      type: CategoryType.BROCHURE,
      pageType: 'cloudbric',
      order: 4,
      description: 'Cloudbric 제품 브로셔',
    },
  ]

  for (const category of categories) {
    const created = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        // 기존 카테고리가 있으면 업데이트 (pageType은 명시된 경우에만 업데이트)
        name: category.name,
        type: category.type,
        order: category.order,
        description: category.description,
        ...(category.pageType !== undefined && { pageType: category.pageType }),
        ...(category.config ? { config: category.config } : {}),
      },
      create: category,
    })
    console.log(`✅ Category created: ${created.name}`)
  }

  await prisma.appSettings.upsert({
    where: { id: 'default' },
    create: { id: 'default', showCredentialsLogin: true },
    update: {},
  })
  console.log('✅ AppSettings ensured')

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

