const projects = {
  maps: {
    meta: "2026 · 사업 기획 / 시장 분석",
    title: "MAPS · 군 장병 AI 정신건강 지원 플랫폼",
    intro: "군 장병의 상담 접근성과 익명성 문제를 다루는 AI 서비스입니다.",
    image: "assets/maps-preview.webp",
    details: [
      "군 장병의 낮은 상담 접근성과 익명성 보장 문제를 해결하기 위한 LLM 기반 정신건강 지원 플랫폼 MAPS의 개발에 참여했습니다.",
      "국내외 경쟁 서비스를 비교하고 사업계획과 수익모델을 작성했습니다. 군 대상 B2G 도입에서 민간 병원 협력과 전역 후 B2C 이용으로 이어지는 확장 방향을 기획했습니다.",
      "해병대 창업경진대회에서 멘토와 군 조직의 요구를 반영해 서비스 방향을 보완하고 팀 발표를 담당했습니다. 혁신상을 수상하고 국방부 본선에 진출했습니다."
    ],
    document: "https://taehoon-kwon-portfolio.bladedsun4.chatgpt.site/documents/maps-business-plan.pdf",
    documentLabel: "MAPS 사업계획서 보기"
  },
  ksef: {
    meta: "2022 · 금융 연구 / 데이터 분석",
    title: "암호자산의 인플레이션 헤지 가능성",
    intro: "비트코인의 헤지자산 가능성과 암호자산별 안정성을 비교한 연구입니다.",
    image: "assets/ksef-preview.webp?v=2",
    details: [
      "비트코인이 시장 위험에 대응하는 헤지자산으로 변화하고 있는지 연구했습니다. 금과의 통계적 비교, 달러지수 등 금융시장 지표와의 관계, 다른 암호자산과의 차이를 살펴봤습니다.",
      "비트코인·이더리움·카르다노·도지코인의 수익률과 시장 지표·검색량을 수집해 상관·회귀분석을 진행했습니다. 비트코인은 2017–2021년을 기간별로 나누어 관계의 변화를 분석했습니다.",
      "분석 결과를 논문과 발표자료로 정리했습니다. 2022 KSEF 은상과 연계 국제대회 GYSTB 3등상을 수상했습니다."
    ],
    document: "https://taehoon-kwon-portfolio.bladedsun4.chatgpt.site/documents/cryptocurrency-research.pdf",
    documentLabel: "암호화폐 연구논문 보기"
  },
  genius: {
    meta: "2023 · 환경 연구 / 교육용 게임",
    title: "컴퓨터 게임으로 살펴본 남획이 수산자원 평가에 미치는 영향",
    intro: "Demonstrating the impact of overfishing in stock assessment using computer game",
    image: "assets/genius-preview.webp",
    details: [
      "무분별한 어획이 수산자원과 어민의 장기적인 수익성에 미치는 영향을 탐구하고, 사용자가 어획량을 조절하며 자원 보존과 경제적 이익의 관계를 경험하는 교육용 게임으로 구성했습니다.",
      "물고기의 성장·번식·사망을 반영한 자원량 변화 모델을 조사했습니다. 어획 결과를 연령·크기 분포와 자원량 그래프로 보여주고, 어획 노력과 운영비용도 함께 검토했습니다.",
      "무분별한 어획과 지속 가능한 어획을 비교하고 최대경제생산량(MEY) 관점을 연구에 반영했습니다. 논문과 포스터를 정리해 GENIUS Olympiad 은상을 수상했습니다."
    ],
    document: "https://taehoon-kwon-portfolio.bladedsun4.chatgpt.site/documents/overfishing-research.pdf",
    documentLabel: "남획 연구논문 보기"
  },
  kasa: {
    meta: "2024–2025 · 운영진 / 펀드레이징",
    title: "KASA · 문화 교류와 펀드레이징",
    intro: "문화 교류 경험을 행사 기획과 모금 활동으로 연결했습니다.",
    image: "assets/kasa-preview.webp",
    details: [
      "한인·한국계 미국인 학생회 KASA의 운영진이자 펀드레이징 총괄로 Local Culture Market, School Fair 등 약 15회의 모금 행사를 관리했습니다.",
      "Culture Night에서 한국 문화에 익숙하지 않은 학생도 참여할 수 있도록 퓨전 음식 체험·판매를 기획했습니다. 다른 문화권 학생회와 협력하고 현지 조달처를 발굴해 최초 예산 대비 비용을 약 25% 절감했습니다.",
      "행사를 통해 신규 회원 9명을 모집하고 약 25명의 가입 관심자·지속 참여자를 확보했습니다."
    ]
  }
};
window.portfolioProjects = projects;

const dialog = document.querySelector(".project-dialog");
const dialogImage = dialog.querySelector(".dialog-image");
const documentSlot = dialog.querySelector("#document-slot");

document.querySelectorAll("[data-project]").forEach((card) => {
  card.addEventListener("click", (event) => {
    if (document.body.classList.contains("editing") && event.target.closest("[contenteditable]")) return;
    const project = projects[card.dataset.project];
    dialog.querySelector("#dialog-meta").textContent = project.meta;
    dialog.querySelector("#dialog-title").textContent = project.title;
    dialog.querySelector("#dialog-intro").textContent = project.intro;
    dialog.querySelector("#dialog-details").replaceChildren(...project.details.map((detail) => {
      const item = document.createElement("li");
      item.textContent = detail;
      return item;
    }));
    dialogImage.hidden = !project.image;
    if (project.image) {
      dialogImage.src = project.image;
      dialogImage.alt = project.title + " 자료 이미지";
    }
    documentSlot.hidden = !project.document;
    if (project.document) {
      documentSlot.href = project.document;
      documentSlot.querySelector(".document-label").textContent = project.documentLabel || "PDF 자료 보기";
    }
    dialog.showModal();
  });
});

dialog.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});
