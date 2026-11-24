(() => {
  const storageKey = "taehoon-portfolio-editor-v3";
  const projects = window.portfolioProjects;
  const dialog = document.querySelector(".project-dialog");
  const targets = new Map();
  const emptyState = () => structuredClone(window.portfolioDefaultEdits || { version: 1, texts: {}, details: {}, orders: {}, layout: {} });
  let state;
  try { state = { ...emptyState(), ...JSON.parse(localStorage.getItem(storageKey) || "{}") }; }
  catch { state = emptyState(); }
  state.texts ||= {};
  state.details ||= {};
  state.orders ||= {};
  state.layout ||= {};
  state.positions ||= { desktop: {}, mobile: {} };
  state.styles ||= {};
  state.images ||= [];

  const status = document.createElement("span");
  status.className = "editor-status";
  status.textContent = "이 브라우저에 자동 저장";
  const save = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
      status.textContent = "이 브라우저에 저장됨";
    } catch { status.textContent = "저장 공간 부족 — JSON을 다운로드하세요"; }
  };

  function bind(node, key) {
    if (!node) return;
    targets.set(key, node);
    node.dataset.editKey = key;
    node.setAttribute("spellcheck", "true");
    if (Object.hasOwn(state.texts, key)) node.textContent = state.texts[key];
    node.addEventListener("input", () => {
      state.texts[key] = node.innerText;
      if (key.startsWith("project.")) {
        const [, id, field] = key.split(".");
        if (field === "title" || field === "meta") {
          projects[id][field] = node.innerText;
          state.details[id] = { ...projects[id], details: [...projects[id].details] };
        }
      }
      if (key === "contact.email") node.href = `mailto:${node.innerText.trim()}`;
      if (key === "contact.phone") node.href = `tel:${node.innerText.replace(/[^+\d]/g, "")}`;
      save();
    });
    node.addEventListener("blur", () => {
      const plain = node.innerText;
      node.textContent = plain;
      state.texts[key] = plain;
      save();
    });
    node.addEventListener("paste", (event) => {
      event.preventDefault();
      const plain = event.clipboardData.getData("text/plain");
      const selection = getSelection();
      if (!selection.rangeCount) return;
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const text = document.createTextNode(plain);
      range.insertNode(text);
      range.setStartAfter(text);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      node.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }
  const one = (selector, key) => bind(document.querySelector(selector), key);
  const many = (selector, prefix) => document.querySelectorAll(selector).forEach((node, index) => bind(node, `${prefix}.${index}`));

  one(".hero-name", "hero.name");
  one(".hero-english", "hero.english");
  one(".hero-statement", "hero.statement");
  one(".hero-sub", "hero.subtitle");
  many(".hero-actions a", "hero.action");
  one(".hero-links a", "hero.emailLabel");
  one(".about h2", "about.title");
  many(".about-copy p", "about.paragraph");
  one(".projects .section-kicker", "projects.kicker");
  one(".projects h2", "projects.title");
  one(".projects .section-heading > p:last-child", "projects.description");
  document.querySelectorAll(".project-card").forEach((card) => {
    const id = card.dataset.project;
    bind(card.querySelector(".project-meta"), `project.${id}.meta`);
    bind(card.querySelector("strong"), `project.${id}.title`);
    bind(card.querySelector(".project-summary"), `project.${id}.summary`);
    bind(card.querySelector(".project-award"), `project.${id}.award`);
  });
  one(".journey .section-kicker", "journey.kicker");
  one(".journey h2", "journey.title");
  document.querySelectorAll(".timeline-entry").forEach((entry, index) => {
    bind(entry.querySelector("h3"), `journey.${index}.title`);
    bind(entry.querySelector(".timeline-date"), `journey.${index}.date`);
    entry.querySelectorAll("li").forEach((li, point) => bind(li, `journey.${index}.point.${point}`));
  });
  many(".highlights-column h2", "highlight.title");
  document.querySelectorAll(".highlights-column:first-child li").forEach((li, index) => {
    bind(li.querySelector("span:first-child"), `award.${index}.date`);
    bind(li.querySelector(".award-label"), `award.${index}.text`);
  });
  document.querySelectorAll(".highlights-column:last-child li").forEach((li, index) => {
    if (li.classList.contains("skill-empty")) bind(li, `skill.${index}.empty`);
    else {
      bind(li.querySelector("strong"), `skill.${index}.title`);
      bind(li.querySelector("small"), `skill.${index}.description`);
    }
  });
  one(".contact .section-kicker", "contact.title");
  one(".contact-links a:first-child", "contact.phone");
  one(".contact-links a:last-child", "contact.email");
  if (targets.get("contact.phone")) targets.get("contact.phone").href = `tel:${targets.get("contact.phone").innerText.replace(/[^+\d]/g, "")}`;
  if (targets.get("contact.email")) targets.get("contact.email").href = `mailto:${targets.get("contact.email").innerText.trim()}`;

  Object.entries(state.details).forEach(([id, detail]) => {
    if (!projects[id] || !detail || !Array.isArray(detail.details)) return;
    Object.assign(projects[id], {
      meta: String(detail.meta), title: String(detail.title), intro: String(detail.intro),
      details: detail.details.map(String)
    });
  });
  Object.keys(projects).forEach((id) => {
    for (const field of ["meta", "title"]) {
      const key = `project.${id}.${field}`;
      if (!Object.hasOwn(state.texts, key) && state.details[id]) {
        const node = targets.get(key);
        if (node) node.textContent = projects[id][field];
      }
    }
  });

  const main = document.querySelector("main");
  const sectionId = (section) => section.id || (section.classList.contains("hero") ? "hero" : "highlights");
  const cardId = (item) => item.querySelector("[data-project]").dataset.project;
  const groups = {
    sections: () => [...main.querySelectorAll(":scope > section")],
    projects: () => [...document.querySelectorAll(".editor-project-item")],
    journey: () => [...document.querySelectorAll(".timeline-entry")],
    highlights: () => [...document.querySelectorAll(".highlights-column")]
  };
  const ids = {
    sections: sectionId,
    projects: cardId,
    journey: (item) => item.dataset.editorId,
    highlights: (item) => item.dataset.editorId
  };
  document.querySelectorAll(".project-card").forEach((card) => {
    const wrapper = document.createElement("div");
    wrapper.className = "editor-project-item";
    card.before(wrapper);
    wrapper.append(card);
  });
  groups.journey().forEach((item, index) => item.dataset.editorId = String(index));
  groups.highlights().forEach((item, index) => item.dataset.editorId = String(index));

  function applyOrder(group) {
    const order = state.orders[group];
    if (!Array.isArray(order)) return;
    const list = groups[group]();
    const parent = list[0]?.parentElement;
    if (!parent) return;
    const byId = new Map(list.map((item) => [ids[group](item), item]));
    order.forEach((id) => { if (byId.has(id)) parent.append(byId.get(id)); });
  }
  Object.keys(groups).forEach(applyOrder);
  const saveOrder = (group) => { state.orders[group] = groups[group]().map(ids[group]); save(); };

  function move(item, group, direction) {
    const list = groups[group]();
    const index = list.indexOf(item);
    const other = list[index + direction];
    if (!other) return;
    if (direction < 0) item.parentElement.insertBefore(item, other);
    else item.parentElement.insertBefore(item, other.nextSibling);
    saveOrder(group);
  }
  function controls(item, group, label) {
    const bar = document.createElement("div");
    bar.className = "editor-block-controls";
    bar.innerHTML = `<span class="editor-drag" draggable="true" title="드래그하여 이동" aria-label="${label} 드래그하여 이동">⠿</span><span>${label}</span><button type="button" title="위로 이동" aria-label="${label} 위로 이동">↑</button><button type="button" title="아래로 이동" aria-label="${label} 아래로 이동">↓</button>`;
    bar.querySelectorAll("button")[0].addEventListener("click", () => move(item, group, -1));
    bar.querySelectorAll("button")[1].addEventListener("click", () => move(item, group, 1));
    bar.querySelector(".editor-drag").addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", `${group}:${ids[group](item)}`);
      event.dataTransfer.effectAllowed = "move";
    });
    item.addEventListener("dragover", (event) => {
      if (!document.body.classList.contains("editing")) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      item.classList.add("editor-drop-target");
    });
    item.addEventListener("dragleave", () => item.classList.remove("editor-drop-target"));
    item.addEventListener("drop", (event) => {
      event.preventDefault();
      item.classList.remove("editor-drop-target");
      const [dragGroup, dragId] = event.dataTransfer.getData("text/plain").split(":");
      if (dragGroup !== group) return;
      const source = groups[group]().find((candidate) => ids[group](candidate) === dragId);
      if (!source || source === item) return;
      const before = event.clientY < item.getBoundingClientRect().top + item.offsetHeight / 2;
      item.parentElement.insertBefore(source, before ? item : item.nextSibling);
      saveOrder(group);
    });
    item.prepend(bar);
  }
  groups.sections().forEach((item) => controls(item, "sections", { hero: "첫 화면", about: "About me", projects: "Projects", journey: "Journey", highlights: "수상·역량", contact: "Contacts" }[sectionId(item)]));
  groups.projects().forEach((item) => {
    controls(item, "projects", "프로젝트");
    const button = document.createElement("button");
    button.className = "editor-detail-button";
    button.type = "button";
    button.textContent = "상세 설명 편집";
    button.addEventListener("click", () => item.querySelector(".project-card").click());
    item.querySelector(".editor-block-controls").append(button);
  });
  groups.journey().forEach((item) => controls(item, "journey", "경험"));
  groups.highlights().forEach((item) => controls(item, "highlights", "항목"));

  function applyLayout() {
    document.body.dataset.projectColumns = state.layout.projectColumns === 1 ? "1" : "2";
    document.body.dataset.photoSide = state.layout.photoSide === "left" ? "left" : "right";
  }
  applyLayout();

  let currentDialogProject = null;
  function editableDialog(id) {
    if (!document.body.classList.contains("editing") || !dialog.open || !projects[id]) return;
    currentDialogProject = id;
    const fields = [["#dialog-meta", "meta"], ["#dialog-title", "title"], ["#dialog-intro", "intro"]];
    fields.forEach(([selector, field]) => {
      const node = dialog.querySelector(selector);
      node.contentEditable = "true";
      node.oninput = () => {
        projects[id][field] = node.innerText;
        state.details[id] = { ...projects[id], details: [...projects[id].details] };
        if (field !== "intro") {
          const cardNode = targets.get(`project.${id}.${field}`);
          if (cardNode) cardNode.textContent = node.innerText;
          state.texts[`project.${id}.${field}`] = node.innerText;
        }
        save();
      };
    });
    dialog.querySelectorAll("#dialog-details li").forEach((node, index) => {
      node.contentEditable = "true";
      node.oninput = () => {
        projects[id].details[index] = node.innerText;
        state.details[id] = { ...projects[id], details: [...projects[id].details] };
        save();
      };
    });
  }
  document.querySelectorAll(".project-card").forEach((card) => card.addEventListener("click", (event) => {
    if (document.body.classList.contains("editing") && !event.target.closest("[contenteditable]")) editableDialog(card.dataset.project);
  }));
  dialog.addEventListener("close", () => { currentDialogProject = null; });

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "editor-toggle";
  toggle.textContent = "✎ 편집";
  toggle.setAttribute("aria-label", "편집 모드 켜기");
  document.body.append(toggle);
  const toolbar = document.createElement("div");
  toolbar.className = "editor-toolbar";
  toolbar.innerHTML = `<strong>포트폴리오 편집</strong><span class="editor-hint">글을 클릭해 수정 · ⠿로 배치 이동</span><label>프로젝트 배열 <select class="editor-columns"><option value="2">2열</option><option value="1">1열</option></select></label><label>사진 위치 <select class="editor-photo"><option value="right">오른쪽</option><option value="left">왼쪽</option></select></label><button type="button" class="editor-export">수정 파일 다운로드</button><button type="button" class="editor-import">파일 불러오기</button><button type="button" class="editor-reset">편집 초기화</button><span class="editor-publish-hint">사이트 반영: 다운로드한 JSON을 이 대화에 첨부</span><input class="editor-file" type="file" accept="application/json,.json" hidden>`;
  toolbar.append(status);
  document.body.prepend(toolbar);
  toolbar.querySelector(".editor-columns").value = String(state.layout.projectColumns || 2);
  toolbar.querySelector(".editor-photo").value = state.layout.photoSide || "right";

  function setEditing(active) {
    document.body.classList.toggle("editing", active);
    targets.forEach((node) => node.contentEditable = active ? "true" : "false");
    const emptySkill = document.querySelector(".skill-empty");
    if (emptySkill) emptySkill.setAttribute("aria-hidden", String(!active && !emptySkill.innerText.trim()));
    toggle.textContent = active ? "✓ 편집 완료" : "✎ 편집";
    toggle.setAttribute("aria-label", active ? "편집 모드 끄기" : "편집 모드 켜기");
    if (dialog.open && currentDialogProject) editableDialog(currentDialogProject);
    if (!active) dialog.querySelectorAll("[contenteditable]").forEach((node) => node.contentEditable = "false");
  }
  toggle.addEventListener("click", () => setEditing(!document.body.classList.contains("editing")));
  document.addEventListener("click", (event) => {
    if (document.body.classList.contains("editing") && event.target.closest("a[data-edit-key]")) event.preventDefault();
  }, true);
  toolbar.querySelector(".editor-columns").addEventListener("change", (event) => {
    state.layout.projectColumns = Number(event.target.value);
    applyLayout(); save();
  });
  toolbar.querySelector(".editor-photo").addEventListener("change", (event) => {
    state.layout.photoSide = event.target.value;
    applyLayout(); save();
  });
  toolbar.querySelector(".editor-export").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "portfolio-edits.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  const file = toolbar.querySelector(".editor-file");
  toolbar.querySelector(".editor-import").addEventListener("click", () => file.click());
  file.addEventListener("change", async () => {
    try {
      const imported = JSON.parse(await file.files[0].text());
      if (imported.version !== 1 || typeof imported.texts !== "object" || typeof imported.orders !== "object") throw Error();
      localStorage.setItem(storageKey, JSON.stringify(imported));
      location.reload();
    } catch { alert("편집 파일을 읽을 수 없습니다. 이 사이트에서 다운로드한 JSON 파일인지 확인해 주세요."); }
  });
  toolbar.querySelector(".editor-reset").addEventListener("click", () => {
    if (confirm("이 브라우저에 저장된 모든 편집 내용을 지울까요?")) {
      localStorage.removeItem(storageKey);
      location.reload();
    }
  });
  window.portfolioEditor = { state, save, targets, toolbar, toggle };
})();
