import type { CharCategory, CharEntry } from '../types'

/**
 * 텍스트 이모티콘(kaomoji) 정적 데이터. 한 줄에 `이모티콘 ‖ 이름 ‖ 검색 키워드`(구분자는 U+2016 「‖」).
 * - 이모티콘 안의 공백·역슬래시를 그대로 복사해야 하므로 `String.raw`를 쓴다(이스케이프 해석 없음).
 * - 템플릿 문자열과 충돌하는 ASCII 백틱(`)은 쓰지 않고 전각 ｀(U+FF40)을 쓴다. `${` 도 넣지 않는다.
 * - 칸 폭이 가변이라 길이는 {@link KAOMOJI_MAX_LENGTH} 코드포인트 이하로 제한한다(테스트로 고정).
 */
export const KAOMOJI_MAX_LENGTH = 30

const SEPARATOR = ' ‖ '

function parse(lines: string): CharEntry[] {
  return lines
    .split('\n')
    .filter((l) => l.trim() !== '')
    .map((line) => {
      const [char, name, keywords = ''] = line.split(SEPARATOR)
      return { char, name: name.trim(), keywords: keywords.trim().toLowerCase(), wide: true as const }
    })
}

export const KAOMOJI_CATEGORIES: CharCategory[] = [
  {
    id: 'happy',
    label: '기쁨·웃음',
    entries: parse(String.raw`
^_^ ‖ 기본 웃는 얼굴 ‖ 웃음 기쁨 행복 smile happy
^^ ‖ 미소 ‖ 웃음 기쁨 smile
(^_^) ‖ 방긋 웃는 얼굴 ‖ 웃음 기쁨 smile
(^o^) ‖ 활짝 웃는 얼굴 ‖ 웃음 기쁨 big smile
(≧▽≦) ‖ 신나는 얼굴 ‖ 신남 기쁨 excited happy
(＾▽＾) ‖ 기분 좋은 얼굴 ‖ 기분 좋음 happy
(*^‿^*) ‖ 수줍게 웃는 얼굴 ‖ 부끄러움 수줍 shy smile
(^‿^) ‖ 부드럽게 웃는 얼굴 ‖ 미소 smile
(✿◠‿◠) ‖ 꽃처럼 웃는 얼굴 ‖ 꽃 미소 flower smile
♪(´▽｀) ‖ 콧노래 부르는 얼굴 ‖ 음악 노래 기분 music song
(o^▽^o) ‖ 환하게 웃는 얼굴 ‖ 웃음 기쁨 smile
＼(^o^)／ ‖ 만세 하는 얼굴 ‖ 만세 신남 hooray cheer
\(^o^)/ ‖ 만세 ‖ 만세 신남 hooray cheer
ヽ(´▽｀)/ ‖ 기뻐서 손 드는 얼굴 ‖ 만세 신남 hooray
♪ヽ(´▽｀)ノ♪ ‖ 신나게 노래하는 얼굴 ‖ 음악 노래 신남 sing
ㅋㅋㅋ ‖ 크크크 웃음 ‖ 웃음 ㅋㅋ lol
ㅎㅎㅎ ‖ 흐흐흐 웃음 ‖ 웃음 ㅎㅎ haha
:) ‖ 웃는 얼굴 ‖ 웃음 미소 smile
:D ‖ 크게 웃는 얼굴 ‖ 웃음 big smile grin
XD ‖ 배꼽 잡고 웃는 얼굴 ‖ 폭소 웃김 laugh lol
;) ‖ 윙크 ‖ 윙크 wink
(^_~)☆ ‖ 윙크하는 얼굴 ‖ 윙크 wink
(｡･ω･｡) ‖ 천진한 얼굴 ‖ 순수 귀여움 cute innocent
`),
  },
  {
    id: 'sad',
    label: '슬픔·울음',
    entries: parse(String.raw`
T_T ‖ 우는 얼굴 ‖ 눈물 슬픔 cry sad
ㅠㅠ ‖ 우는 얼굴(한글) ‖ 눈물 슬픔 ㅠㅠ cry
ㅜㅜ ‖ 훌쩍이는 얼굴 ‖ 눈물 슬픔 ㅜㅜ cry
(ToT) ‖ 눈물 줄줄 ‖ 눈물 슬픔 cry
(;_;) ‖ 눈물 맺힌 얼굴 ‖ 눈물 슬픔 tear
(T▽T) ‖ 감동의 눈물 ‖ 감동 눈물 touched cry
(´；ω；｀) ‖ 울먹이는 얼굴 ‖ 울먹 눈물 sob
(╥﹏╥) ‖ 서럽게 우는 얼굴 ‖ 서러움 눈물 sob cry
(ಥ_ಥ) ‖ 눈물 흘리는 얼굴 ‖ 눈물 슬픔 cry
:'( ‖ 눈물 ‖ 눈물 슬픔 cry
(；´Д｀) ‖ 낙담한 얼굴 ‖ 낙담 실망 disappointed
(´-ω-｀) ‖ 시무룩한 얼굴 ‖ 시무룩 우울 gloomy sad
(._.) ‖ 풀 죽은 얼굴 ‖ 시무룩 우울 sad
orz ‖ 좌절 ‖ 좌절 절망 실망 despair
OTL ‖ 엎드려 좌절 ‖ 좌절 절망 despair
_| ̄|○ ‖ 바닥에 엎드려 좌절 ‖ 좌절 절망 despair
`),
  },
  {
    id: 'surprised',
    label: '놀람·당황',
    entries: parse(String.raw`
(°o°) ‖ 놀란 얼굴 ‖ 놀람 surprised
(O_O) ‖ 눈 동그란 얼굴 ‖ 놀람 surprised
(⊙_⊙) ‖ 휘둥그레진 눈 ‖ 놀람 surprised wide eyes
(@_@) ‖ 어지러운 얼굴 ‖ 어지럼 dizzy
Σ(°△°|||)︴ ‖ 충격받은 얼굴 ‖ 충격 쇼크 shock
(ﾟДﾟ;) ‖ 당황한 얼굴 ‖ 당황 놀람 flustered
(；ﾟдﾟ) ‖ 깜짝 놀란 얼굴 ‖ 깜짝 놀람 startled
(*_*) ‖ 멍한 얼굴 ‖ 멍 황홀 dazed
0_0 ‖ 눈 크게 뜬 얼굴 ‖ 놀람 wide eyes
(-_-;) ‖ 식은땀 흘리는 얼굴 ‖ 당황 식은땀 sweat nervous
(￣▽￣;) ‖ 어색한 웃음 ‖ 민망 어색 awkward
(・・;) ‖ 난감한 얼굴 ‖ 난감 당황 awkward
((((；ﾟДﾟ)))) ‖ 덜덜 떠는 얼굴 ‖ 공포 무서움 떨림 scared shaking
(？_？) ‖ 물음표 얼굴 ‖ 의문 궁금 confused
(・_・ヾ ‖ 갸우뚱하는 얼굴 ‖ 갸우뚱 의문 puzzled
`),
  },
  {
    id: 'angry',
    label: '화남·짜증',
    entries: parse(String.raw`
(╬ Ò﹏Ó) ‖ 불같이 화난 얼굴 ‖ 분노 화남 angry furious
(｀へ´) ‖ 삐친 얼굴 ‖ 삐침 화남 sulking angry
(｀Д´) ‖ 화난 얼굴 ‖ 화남 angry
ヽ(｀Д´)ﾉ ‖ 버럭 화내는 얼굴 ‖ 버럭 분노 angry yelling
-_- ‖ 무표정 짜증 ‖ 짜증 무표정 annoyed meh
(ㅡ_ㅡ) ‖ 어이없는 얼굴 ‖ 어이없음 짜증 annoyed
(¬_¬) ‖ 흘겨보는 얼굴 ‖ 흘겨봄 의심 side eye
(ಠ_ಠ) ‖ 못마땅한 얼굴 ‖ 못마땅 불만 disapproval
(－－〆) ‖ 째려보는 얼굴 ‖ 째려봄 glare
(눈_눈) ‖ 째려보는 얼굴(한글) ‖ 째려봄 glare
(╯°□°)╯︵ ┻━┻ ‖ 테이블 뒤집기 ‖ 분노 폭발 table flip rage
┬─┬ ノ( ゜-゜ノ) ‖ 테이블 다시 세우기 ‖ 진정 침착 table unflip calm
┐(￣ヘ￣)┌ ‖ 어이없어 어깨 으쓱 ‖ 어이없음 한숨 포기 sigh meh
┐(´д｀)┌ ‖ 한숨 쉬며 어깨 으쓱 ‖ 한숨 체념 sigh
(´_ゝ｀) ‖ 시큰둥한 얼굴 ‖ 시큰둥 무관심 indifferent
`),
  },
  {
    id: 'greeting',
    label: '인사·응원·감사',
    entries: parse(String.raw`
m(_ _)m ‖ 고개 숙여 인사 ‖ 감사 사과 죄송 부탁 절 bow thanks sorry
(_ _) ‖ 공손한 인사 ‖ 인사 감사 bow
(^人^) ‖ 부탁드립니다 ‖ 부탁 기도 소원 please pray
(⌒▽⌒)ゞ ‖ 경례하는 얼굴 ‖ 경례 인사 salute
(^_^)/ ‖ 손 흔드는 얼굴 ‖ 안녕 인사 hello bye wave
( ´ ▽ ｀ )ﾉ ‖ 반갑게 인사 ‖ 안녕 인사 hello hi wave
ヾ(＾∇＾) ‖ 반갑게 손 흔들기 ‖ 안녕 인사 hello
o(≧▽≦)o ‖ 신나는 응원 ‖ 응원 힘내 cheer
(ง •̀_•́)ง ‖ 파이팅 ‖ 파이팅 힘내 응원 fighting go
(๑•̀ㅂ•́)و✧ ‖ 힘내자 ‖ 파이팅 의지 응원 fighting
(b^_^)b ‖ 엄지 척 ‖ 최고 좋아요 굿 good job thumbs up
d(^_^)b ‖ 양손 엄지 척 ‖ 최고 좋아요 굿 good job thumbs up
(*´▽｀*)ノ ‖ 수줍게 손 흔들기 ‖ 안녕 인사 hello shy wave
`),
  },
  {
    id: 'love',
    label: '사랑·하트',
    entries: parse(String.raw`
<3 ‖ 하트 ‖ 하트 사랑 heart love
♥‿♥ ‖ 하트 눈 ‖ 하트 사랑 반함 heart eyes love
(｡♥‿♥｡) ‖ 사랑에 빠진 얼굴 ‖ 하트 사랑 반함 in love
(♡´▽｀♡) ‖ 사랑 가득한 얼굴 ‖ 하트 사랑 행복 love
(´∀｀)♡ ‖ 하트 날리는 얼굴 ‖ 하트 사랑 love
(´,,•ω•,,)♡ ‖ 수줍은 사랑 ‖ 하트 사랑 수줍 shy love
(づ｡◕‿‿◕｡)づ ‖ 안아 주기 ‖ 포옹 허그 안기 hug
(づ￣ ³￣)づ ‖ 뽀뽀해 주기 ‖ 뽀뽀 키스 kiss
(*´з｀*) ‖ 뽀뽀하는 얼굴 ‖ 뽀뽀 키스 kiss
(˘³˘)♥ ‖ 쪽 하트 ‖ 뽀뽀 키스 하트 kiss heart
(*˘︶˘*)♡ ‖ 행복한 얼굴 하트 ‖ 하트 행복 happy heart
♡ヽ(´▽｀)/♡ ‖ 하트와 만세 ‖ 하트 만세 사랑 love cheer
`),
  },
  {
    id: 'animals',
    label: '동물',
    entries: parse(String.raw`
ʕ•ᴥ•ʔ ‖ 곰 ‖ 곰 동물 bear
(=^･ω･^=) ‖ 고양이 ‖ 고양이 냥이 동물 cat
(=^･^=) ‖ 고양이 얼굴 ‖ 고양이 냥이 cat
(=｀ω´=) ‖ 새침한 고양이 ‖ 고양이 냥이 cat
(ΦωΦ) ‖ 눈 반짝이는 고양이 ‖ 고양이 냥이 cat
U・ᴥ・U ‖ 강아지 ‖ 강아지 개 멍멍 dog puppy
∪･ω･∪ ‖ 귀여운 강아지 ‖ 강아지 개 멍멍 dog puppy
(V●ᴥ●V) ‖ 큰 눈 강아지 ‖ 강아지 개 멍멍 dog puppy
(∪｡∪)｡｡｡zzz ‖ 잠자는 강아지 ‖ 강아지 잠 졸음 sleep dog
(・θ・) ‖ 작은 새 ‖ 새 동물 bird
@(・●・)@ ‖ 판다 ‖ 판다 곰 동물 panda
<ﾟ)))彡 ‖ 물고기 ‖ 물고기 생선 fish
>°)))彡 ‖ 헤엄치는 물고기 ‖ 물고기 생선 fish
`),
  },
  {
    id: 'etc',
    label: '기타·장난',
    entries: parse(String.raw`
¯\_(ツ)_/¯ ‖ 어깨 으쓱 ‖ 모르겠다 글쎄 몰라 shrug idk
( ͡° ͜ʖ ͡°) ‖ 음흉한 얼굴 ‖ 음흉 장난 lenny
(⌐■_■) ‖ 선글라스 쓴 얼굴 ‖ 선글라스 멋짐 쿨 cool sunglasses
(•_•) ( •_•)>⌐■-■ (⌐■_■) ‖ 선글라스 쓰기 ‖ 선글라스 멋짐 쿨 cool deal with it
(-.-)Zzz… ‖ 잠자는 얼굴 ‖ 잠 졸음 zzz sleep
(－ω－) zzz ‖ 쿨쿨 자는 얼굴 ‖ 잠 졸음 zzz sleep
(￣o￣) zzZZzzZZ ‖ 졸린 얼굴 ‖ 졸림 잠 sleepy
(￣ー￣) ‖ 덤덤한 얼굴 ‖ 무표정 덤덤 poker face
(￣へ￣) ‖ 시큰둥한 입 ‖ 시큰둥 불만 unimpressed
( ˘▽˘)っ♨ ‖ 차 한 잔 ‖ 차 커피 휴식 tea coffee break
(∩^o^)⊃━☆ ‖ 마법 지팡이 ‖ 마법 요술 magic
☆彡 ‖ 별똥별 ‖ 별 소원 shooting star
(´･_･｀) ‖ 곤란한 얼굴 ‖ 곤란 난감 troubled
`),
  },
]
