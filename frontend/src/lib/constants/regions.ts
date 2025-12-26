// 서비스 가능 지역 상수 (기존 호환)
export const SERVICE_REGIONS = [
  {
    id: "yangpyeong",
    name: "양평군",
    province: "경기도",
    areas: [
      "양평읍",
      "강상면",
      "강하면",
      "양서면",
      "옥천면",
      "서종면",
      "단월면",
      "청운면",
      "양동면",
      "지평면",
      "용문면",
    ],
  },
  {
    id: "gapyeong",
    name: "가평군",
    province: "경기도",
    areas: [
      "가평읍",
      "설악면",
      "청평면",
      "상면",
      "조종면",
      "북면",
    ],
  },
] as const;

export type RegionId = (typeof SERVICE_REGIONS)[number]["id"];

// 전체 서비스 지역 이름 목록
export const ALL_REGION_NAMES = SERVICE_REGIONS.map((r) => r.name);

// ============================================
// 대한민국 행정구역 데이터 (시/도 → 시/군/구)
// 2024년 기준 행정구역
// ============================================

export interface District {
  code: string;
  name: string;
}

export interface Province {
  code: string;
  name: string;
  shortName: string;
  districts: District[];
}

// 전국 시/도 및 시/군/구 데이터
export const KOREA_REGIONS: Province[] = [
  {
    code: "11",
    name: "서울특별시",
    shortName: "서울",
    districts: [
      { code: "11010", name: "종로구" },
      { code: "11020", name: "중구" },
      { code: "11030", name: "용산구" },
      { code: "11040", name: "성동구" },
      { code: "11050", name: "광진구" },
      { code: "11060", name: "동대문구" },
      { code: "11070", name: "중랑구" },
      { code: "11080", name: "성북구" },
      { code: "11090", name: "강북구" },
      { code: "11100", name: "도봉구" },
      { code: "11110", name: "노원구" },
      { code: "11120", name: "은평구" },
      { code: "11130", name: "서대문구" },
      { code: "11140", name: "마포구" },
      { code: "11150", name: "양천구" },
      { code: "11160", name: "강서구" },
      { code: "11170", name: "구로구" },
      { code: "11180", name: "금천구" },
      { code: "11190", name: "영등포구" },
      { code: "11200", name: "동작구" },
      { code: "11210", name: "관악구" },
      { code: "11220", name: "서초구" },
      { code: "11230", name: "강남구" },
      { code: "11240", name: "송파구" },
      { code: "11250", name: "강동구" },
    ],
  },
  {
    code: "26",
    name: "부산광역시",
    shortName: "부산",
    districts: [
      { code: "26010", name: "중구" },
      { code: "26020", name: "서구" },
      { code: "26030", name: "동구" },
      { code: "26040", name: "영도구" },
      { code: "26050", name: "부산진구" },
      { code: "26060", name: "동래구" },
      { code: "26070", name: "남구" },
      { code: "26080", name: "북구" },
      { code: "26090", name: "해운대구" },
      { code: "26100", name: "사하구" },
      { code: "26110", name: "금정구" },
      { code: "26120", name: "강서구" },
      { code: "26130", name: "연제구" },
      { code: "26140", name: "수영구" },
      { code: "26150", name: "사상구" },
      { code: "26160", name: "기장군" },
    ],
  },
  {
    code: "27",
    name: "대구광역시",
    shortName: "대구",
    districts: [
      { code: "27010", name: "중구" },
      { code: "27020", name: "동구" },
      { code: "27030", name: "서구" },
      { code: "27040", name: "남구" },
      { code: "27050", name: "북구" },
      { code: "27060", name: "수성구" },
      { code: "27070", name: "달서구" },
      { code: "27080", name: "달성군" },
      { code: "27090", name: "군위군" },
    ],
  },
  {
    code: "28",
    name: "인천광역시",
    shortName: "인천",
    districts: [
      { code: "28010", name: "중구" },
      { code: "28020", name: "동구" },
      { code: "28030", name: "미추홀구" },
      { code: "28040", name: "연수구" },
      { code: "28050", name: "남동구" },
      { code: "28060", name: "부평구" },
      { code: "28070", name: "계양구" },
      { code: "28080", name: "서구" },
      { code: "28090", name: "강화군" },
      { code: "28100", name: "옹진군" },
    ],
  },
  {
    code: "29",
    name: "광주광역시",
    shortName: "광주",
    districts: [
      { code: "29010", name: "동구" },
      { code: "29020", name: "서구" },
      { code: "29030", name: "남구" },
      { code: "29040", name: "북구" },
      { code: "29050", name: "광산구" },
    ],
  },
  {
    code: "30",
    name: "대전광역시",
    shortName: "대전",
    districts: [
      { code: "30010", name: "동구" },
      { code: "30020", name: "중구" },
      { code: "30030", name: "서구" },
      { code: "30040", name: "유성구" },
      { code: "30050", name: "대덕구" },
    ],
  },
  {
    code: "31",
    name: "울산광역시",
    shortName: "울산",
    districts: [
      { code: "31010", name: "중구" },
      { code: "31020", name: "남구" },
      { code: "31030", name: "동구" },
      { code: "31040", name: "북구" },
      { code: "31050", name: "울주군" },
    ],
  },
  {
    code: "36",
    name: "세종특별자치시",
    shortName: "세종",
    districts: [
      { code: "36010", name: "세종시" },
    ],
  },
  {
    code: "41",
    name: "경기도",
    shortName: "경기",
    districts: [
      { code: "41010", name: "수원시" },
      { code: "41020", name: "성남시" },
      { code: "41030", name: "의정부시" },
      { code: "41040", name: "안양시" },
      { code: "41050", name: "부천시" },
      { code: "41060", name: "광명시" },
      { code: "41070", name: "평택시" },
      { code: "41080", name: "동두천시" },
      { code: "41090", name: "안산시" },
      { code: "41100", name: "고양시" },
      { code: "41110", name: "과천시" },
      { code: "41120", name: "구리시" },
      { code: "41130", name: "남양주시" },
      { code: "41140", name: "오산시" },
      { code: "41150", name: "시흥시" },
      { code: "41160", name: "군포시" },
      { code: "41170", name: "의왕시" },
      { code: "41180", name: "하남시" },
      { code: "41190", name: "용인시" },
      { code: "41200", name: "파주시" },
      { code: "41210", name: "이천시" },
      { code: "41220", name: "안성시" },
      { code: "41230", name: "김포시" },
      { code: "41240", name: "화성시" },
      { code: "41250", name: "광주시" },
      { code: "41260", name: "양주시" },
      { code: "41270", name: "포천시" },
      { code: "41280", name: "여주시" },
      { code: "41290", name: "연천군" },
      { code: "41300", name: "가평군" },
      { code: "41310", name: "양평군" },
    ],
  },
  {
    code: "51",
    name: "강원특별자치도",
    shortName: "강원",
    districts: [
      { code: "51010", name: "춘천시" },
      { code: "51020", name: "원주시" },
      { code: "51030", name: "강릉시" },
      { code: "51040", name: "동해시" },
      { code: "51050", name: "태백시" },
      { code: "51060", name: "속초시" },
      { code: "51070", name: "삼척시" },
      { code: "51080", name: "홍천군" },
      { code: "51090", name: "횡성군" },
      { code: "51100", name: "영월군" },
      { code: "51110", name: "평창군" },
      { code: "51120", name: "정선군" },
      { code: "51130", name: "철원군" },
      { code: "51140", name: "화천군" },
      { code: "51150", name: "양구군" },
      { code: "51160", name: "인제군" },
      { code: "51170", name: "고성군" },
      { code: "51180", name: "양양군" },
    ],
  },
  {
    code: "43",
    name: "충청북도",
    shortName: "충북",
    districts: [
      { code: "43010", name: "청주시" },
      { code: "43020", name: "충주시" },
      { code: "43030", name: "제천시" },
      { code: "43040", name: "보은군" },
      { code: "43050", name: "옥천군" },
      { code: "43060", name: "영동군" },
      { code: "43070", name: "증평군" },
      { code: "43080", name: "진천군" },
      { code: "43090", name: "괴산군" },
      { code: "43100", name: "음성군" },
      { code: "43110", name: "단양군" },
    ],
  },
  {
    code: "44",
    name: "충청남도",
    shortName: "충남",
    districts: [
      { code: "44010", name: "천안시" },
      { code: "44020", name: "공주시" },
      { code: "44030", name: "보령시" },
      { code: "44040", name: "아산시" },
      { code: "44050", name: "서산시" },
      { code: "44060", name: "논산시" },
      { code: "44070", name: "계룡시" },
      { code: "44080", name: "당진시" },
      { code: "44090", name: "금산군" },
      { code: "44100", name: "부여군" },
      { code: "44110", name: "서천군" },
      { code: "44120", name: "청양군" },
      { code: "44130", name: "홍성군" },
      { code: "44140", name: "예산군" },
      { code: "44150", name: "태안군" },
    ],
  },
  {
    code: "52",
    name: "전북특별자치도",
    shortName: "전북",
    districts: [
      { code: "52010", name: "전주시" },
      { code: "52020", name: "군산시" },
      { code: "52030", name: "익산시" },
      { code: "52040", name: "정읍시" },
      { code: "52050", name: "남원시" },
      { code: "52060", name: "김제시" },
      { code: "52070", name: "완주군" },
      { code: "52080", name: "진안군" },
      { code: "52090", name: "무주군" },
      { code: "52100", name: "장수군" },
      { code: "52110", name: "임실군" },
      { code: "52120", name: "순창군" },
      { code: "52130", name: "고창군" },
      { code: "52140", name: "부안군" },
    ],
  },
  {
    code: "46",
    name: "전라남도",
    shortName: "전남",
    districts: [
      { code: "46010", name: "목포시" },
      { code: "46020", name: "여수시" },
      { code: "46030", name: "순천시" },
      { code: "46040", name: "나주시" },
      { code: "46050", name: "광양시" },
      { code: "46060", name: "담양군" },
      { code: "46070", name: "곡성군" },
      { code: "46080", name: "구례군" },
      { code: "46090", name: "고흥군" },
      { code: "46100", name: "보성군" },
      { code: "46110", name: "화순군" },
      { code: "46120", name: "장흥군" },
      { code: "46130", name: "강진군" },
      { code: "46140", name: "해남군" },
      { code: "46150", name: "영암군" },
      { code: "46160", name: "무안군" },
      { code: "46170", name: "함평군" },
      { code: "46180", name: "영광군" },
      { code: "46190", name: "장성군" },
      { code: "46200", name: "완도군" },
      { code: "46210", name: "진도군" },
      { code: "46220", name: "신안군" },
    ],
  },
  {
    code: "47",
    name: "경상북도",
    shortName: "경북",
    districts: [
      { code: "47010", name: "포항시" },
      { code: "47020", name: "경주시" },
      { code: "47030", name: "김천시" },
      { code: "47040", name: "안동시" },
      { code: "47050", name: "구미시" },
      { code: "47060", name: "영주시" },
      { code: "47070", name: "영천시" },
      { code: "47080", name: "상주시" },
      { code: "47090", name: "문경시" },
      { code: "47100", name: "경산시" },
      { code: "47110", name: "의성군" },
      { code: "47120", name: "청송군" },
      { code: "47130", name: "영양군" },
      { code: "47140", name: "영덕군" },
      { code: "47150", name: "청도군" },
      { code: "47160", name: "고령군" },
      { code: "47170", name: "성주군" },
      { code: "47180", name: "칠곡군" },
      { code: "47190", name: "예천군" },
      { code: "47200", name: "봉화군" },
      { code: "47210", name: "울진군" },
      { code: "47220", name: "울릉군" },
    ],
  },
  {
    code: "48",
    name: "경상남도",
    shortName: "경남",
    districts: [
      { code: "48010", name: "창원시" },
      { code: "48020", name: "진주시" },
      { code: "48030", name: "통영시" },
      { code: "48040", name: "사천시" },
      { code: "48050", name: "김해시" },
      { code: "48060", name: "밀양시" },
      { code: "48070", name: "거제시" },
      { code: "48080", name: "양산시" },
      { code: "48090", name: "의령군" },
      { code: "48100", name: "함안군" },
      { code: "48110", name: "창녕군" },
      { code: "48120", name: "고성군" },
      { code: "48130", name: "남해군" },
      { code: "48140", name: "하동군" },
      { code: "48150", name: "산청군" },
      { code: "48160", name: "함양군" },
      { code: "48170", name: "거창군" },
      { code: "48180", name: "합천군" },
    ],
  },
  {
    code: "50",
    name: "제주특별자치도",
    shortName: "제주",
    districts: [
      { code: "50010", name: "제주시" },
      { code: "50020", name: "서귀포시" },
    ],
  },
];

// 선택된 지역 데이터 타입
export interface SelectedRegion {
  provinceCode: string;
  provinceName: string;
  districtCodes: string[]; // 빈 배열이면 전체 선택
  districtNames: string[]; // 빈 배열이면 전체 선택
  isAllDistricts: boolean;
}

// 지역 선택 결과를 문자열로 변환
export function formatSelectedRegions(regions: SelectedRegion[]): string {
  return regions
    .map((r) => {
      if (r.isAllDistricts) {
        return `${r.provinceName} 전체`;
      }
      return `${r.provinceName} ${r.districtNames.join(", ")}`;
    })
    .join(" / ");
}

// 시/도 코드로 시/도 찾기
export function getProvinceByCode(code: string): Province | undefined {
  return KOREA_REGIONS.find((p) => p.code === code);
}

// 시/군/구 코드로 시/군/구 찾기
export function getDistrictByCode(
  provinceCode: string,
  districtCode: string
): District | undefined {
  const province = getProvinceByCode(provinceCode);
  return province?.districts.find((d) => d.code === districtCode);
}
