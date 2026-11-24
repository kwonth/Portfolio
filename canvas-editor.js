(() => {
  const editor = window.portfolioEditor;
  if (!editor) return;
  const { state, save, targets, toolbar, toggle } = editor;
  const mobileQuery = matchMedia("(max-width: 760px)");
  const screen = () => mobileQuery.matches ? "mobile" : "desktop";
  state.positions ||= { desktop: {}, mobile: {} };
  state.positions.desktop ||= {};
  state.positions.mobile ||= {};
  state.styles ||= {};
  state.images ||= [];

  const tools = document.createElement("div");
  tools.className = "canvas-tools";
  tools.innerHTML = `<button type="button" class="canvas-move-text" aria-pressed="false">텍스트 위치 이동</button><button type="button" class="canvas-reset-position" disabled>위치 원복</button><span class="canvas-selection">텍스트를 선택하세요</span><label>크기 <input class="canvas-font-size" type="number" min="10" max="120" step="1" aria-label="선택한 텍스트 크기" disabled>px</label><label>굵기 <select class="canvas-font-weight" aria-label="선택한 텍스트 굵기" disabled><option value="400">보통</option><option value="500">중간</option><option value="600">약간 굵게</option><option value="700">굵게</option><option value="800">매우 굵게</option></select></label><button type="button" class="canvas-add-image">사진 추가</button><button type="button" class="canvas-remove-image" disabled>사진 삭제</button><input class="canvas-image-file" type="file" accept="image/*" hidden>`;
  toolbar.insertBefore(tools, toolbar.querySelector(".editor-publish-hint"));
  const moveButton = tools.querySelector(".canvas-move-text");
  const sizeInput = tools.querySelector(".canvas-font-size");
  const weightInput = tools.querySelector(".canvas-font-weight");
  const selectionLabel = tools.querySelector(".canvas-selection");
  const imageInput = tools.querySelector(".canvas-image-file");
  const removeImageButton = tools.querySelector(".canvas-remove-image");
  const resetPositionButton = tools.querySelector(".canvas-reset-position");
  let selectedText = null;
  let selectedImage = null;
  let selectedSection = document.querySelector(".about");
  let movingText = false;

  function selectText(key) {
    selectedText = key;
    selectedImage = null;
    document.querySelectorAll(".canvas-selected-text").forEach((node) => node.classList.remove("canvas-selected-text"));
    const node = targets.get(key);
    node.classList.add("canvas-selected-text");
    selectedSection = node.closest("section") || selectedSection;
    selectionLabel.textContent = (node.innerText || "빈 텍스트").trim().slice(0, 19);
    sizeInput.disabled = false;
    weightInput.disabled = false;
    sizeInput.value = Math.round(parseFloat(getComputedStyle(node).fontSize));
    const weight = Number(getComputedStyle(node).fontWeight);
    weightInput.value = String([400, 500, 600, 700, 800].reduce((best, item) => Math.abs(item - weight) < Math.abs(best - weight) ? item : best, 400));
    document.querySelectorAll(".placed-image").forEach((frame) => frame.classList.remove("canvas-selected-image"));
    removeImageButton.disabled = true;
    resetPositionButton.disabled = false;
  }

  function applyTextStyle(key) {
    const node = targets.get(key);
    const style = state.styles[key];
    if (!node || !style || typeof style !== "object") return;
    const size = Number(style.size);
    const weight = Number(style.weight);
    if (size >= 10 && size <= 120) node.style.fontSize = `${size}px`;
    if ([400, 500, 600, 700, 800].includes(weight)) node.style.fontWeight = String(weight);
  }
  targets.forEach((_, key) => applyTextStyle(key));
  sizeInput.addEventListener("input", () => {
    if (!selectedText) return;
    const size = Number(sizeInput.value);
    if (size < 10 || size > 120) return;
    state.styles[selectedText] ||= {};
    state.styles[selectedText].size = size;
    applyTextStyle(selectedText);
    save();
  });
  weightInput.addEventListener("change", () => {
    if (!selectedText) return;
    state.styles[selectedText] ||= {};
    state.styles[selectedText].weight = Number(weightInput.value);
    applyTextStyle(selectedText);
    save();
  });

  function applyTextPositions() {
    targets.forEach((node, key) => {
      const point = state.positions[screen()][key];
      node.style.left = point && Number.isFinite(Number(point.x)) ? `${Number(point.x)}px` : "";
      node.style.top = point && Number.isFinite(Number(point.y)) ? `${Number(point.y)}px` : "";
    });
  }
  applyTextPositions();
  mobileQuery.addEventListener("change", applyTextPositions);

  function setMoveMode(active) {
    movingText = active && document.body.classList.contains("editing");
    document.body.classList.toggle("moving-text", movingText);
    moveButton.textContent = movingText ? "글 수정으로 돌아가기" : "텍스트 위치 이동";
    moveButton.setAttribute("aria-pressed", String(movingText));
    targets.forEach((node) => node.contentEditable = document.body.classList.contains("editing") && !movingText ? "true" : "false");
  }
  moveButton.addEventListener("click", () => setMoveMode(!movingText));
  resetPositionButton.addEventListener("click", () => {
    if (!selectedText) return;
    delete state.positions[screen()][selectedText];
    applyTextPositions();
    save();
  });
  toggle.addEventListener("click", () => { if (!document.body.classList.contains("editing")) setMoveMode(false); });

  targets.forEach((node, key) => {
    node.addEventListener("click", () => { if (document.body.classList.contains("editing")) selectText(key); });
    node.addEventListener("pointerdown", (event) => {
      if (!movingText || event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      selectText(key);
      const point = state.positions[screen()][key] || { x: 0, y: 0 };
      const start = { x: event.clientX, y: event.clientY, left: Number(point.x) || 0, top: Number(point.y) || 0 };
      node.setPointerCapture(event.pointerId);
      const onMove = (moveEvent) => {
        const x = Math.round(start.left + moveEvent.clientX - start.x);
        const y = Math.round(start.top + moveEvent.clientY - start.y);
        node.style.left = `${x}px`;
        node.style.top = `${y}px`;
        state.positions[screen()][key] = { x, y };
      };
      const onEnd = () => {
        node.removeEventListener("pointermove", onMove);
        node.removeEventListener("pointerup", onEnd);
        node.removeEventListener("pointercancel", onEnd);
        save();
      };
      node.addEventListener("pointermove", onMove);
      node.addEventListener("pointerup", onEnd);
      node.addEventListener("pointercancel", onEnd);
    });
    node.addEventListener("keydown", (event) => {
      if (!movingText || !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const point = state.positions[screen()][key] || { x: 0, y: 0 };
      const amount = event.shiftKey ? 20 : 5;
      if (event.key === "ArrowUp") point.y -= amount;
      if (event.key === "ArrowDown") point.y += amount;
      if (event.key === "ArrowLeft") point.x -= amount;
      if (event.key === "ArrowRight") point.x += amount;
      state.positions[screen()][key] = point;
      applyTextPositions();
      save();
    });
  });

  const sectionId = (section) => section.id || (section.classList.contains("hero") ? "hero" : "highlights");
  const findSection = (id) => [...document.querySelectorAll("main > section")].find((section) => sectionId(section) === id);
  const imageFrames = new Map();

  function selectImage(image) {
    selectedImage = image;
    selectedText = null;
    document.querySelectorAll(".canvas-selected-text, .canvas-selected-image").forEach((node) => node.classList.remove("canvas-selected-text", "canvas-selected-image"));
    imageFrames.get(image.id)?.classList.add("canvas-selected-image");
    selectionLabel.textContent = image.name || "사진";
    sizeInput.disabled = true;
    weightInput.disabled = true;
    removeImageButton.disabled = false;
    resetPositionButton.disabled = true;
    selectedSection = findSection(image.section) || selectedSection;
  }

  function imageGeometry(image) {
    const section = findSection(image.section);
    let original = image.positions?.[screen()] || image.positions?.desktop || { x: 20, y: 90, width: 280 };
    if (screen() === "mobile" && !image.positions?.mobile && section) {
      const placeholder = section.querySelector(".portrait-placeholder")?.getBoundingClientRect();
      const bounds = section.getBoundingClientRect();
      original = placeholder
        ? { x: placeholder.left - bounds.left, y: placeholder.top - bounds.top, width: placeholder.width }
        : { x: 24, y: Math.max(100, section.clientHeight - 260), width: Math.min(260, section.clientWidth - 48) };
    }
    const width = Math.min(Math.max(80, Number(original.width) || 280), Math.max(80, (section?.clientWidth || 320) - 24));
    return { x: Number(original.x) || 0, y: Number(original.y) || 0, width };
  }
  function placeImage(image) {
    const frame = imageFrames.get(image.id);
    const section = findSection(image.section);
    if (!frame || !section) return;
    if (frame.parentElement !== section) section.append(frame);
    const position = imageGeometry(image);
    frame.style.left = `${position.x}px`;
    frame.style.top = `${position.y}px`;
    frame.style.width = `${position.width}px`;
  }
  mobileQuery.addEventListener("change", () => state.images.forEach(placeImage));

  function mountImage(image) {
    if (!image || typeof image.src !== "string" || !image.src.startsWith("data:image/")) return;
    const section = findSection(image.section);
    if (!section) return;
    const frame = document.createElement("div");
    frame.className = "placed-image";
    frame.title = "끌어서 사진 이동";
    frame.dataset.imageId = image.id;
    const img = document.createElement("img");
    img.src = image.src;
    img.alt = image.name || "추가한 사진";
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "placed-image-remove";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `${img.alt} 삭제`);
    const resize = document.createElement("span");
    resize.className = "placed-image-resize";
    resize.setAttribute("role", "button");
    resize.setAttribute("aria-label", `${img.alt} 크기 조절`);
    resize.title = "끌어서 크기 조절";
    frame.append(img, remove, resize);
    section.append(frame);
    imageFrames.set(image.id, frame);
    placeImage(image);
    frame.addEventListener("click", () => { if (document.body.classList.contains("editing")) selectImage(image); });
    remove.addEventListener("click", (event) => {
      event.stopPropagation();
      if (!confirm("이 사진을 삭제할까요?")) return;
      state.images = state.images.filter((item) => item.id !== image.id);
      imageFrames.delete(image.id);
      frame.remove();
      selectedImage = null;
      removeImageButton.disabled = true;
      save();
    });
    frame.addEventListener("pointerdown", (event) => {
      if (!document.body.classList.contains("editing") || event.button !== 0 || event.target === remove || event.target === resize) return;
      event.preventDefault();
      event.stopPropagation();
      selectImage(image);
      const position = imageGeometry(image);
      const start = { x: event.clientX, y: event.clientY, left: position.x, top: position.y };
      frame.setPointerCapture(event.pointerId);
      const onMove = (moveEvent) => {
        frame.style.left = `${Math.round(start.left + moveEvent.clientX - start.x)}px`;
        frame.style.top = `${Math.round(start.top + moveEvent.clientY - start.y)}px`;
      };
      const onEnd = (endEvent) => {
        frame.removeEventListener("pointermove", onMove);
        frame.removeEventListener("pointerup", onEnd);
        frame.removeEventListener("pointercancel", onEnd);
        frame.style.pointerEvents = "none";
        const under = document.elementFromPoint(endEvent.clientX, endEvent.clientY)?.closest("main > section");
        frame.style.pointerEvents = "";
        const current = findSection(image.section);
        const destination = under || current;
        let x = parseFloat(frame.style.left) || 0;
        let y = parseFloat(frame.style.top) || 0;
        if (destination !== current) {
          const from = current.getBoundingClientRect();
          const to = destination.getBoundingClientRect();
          x += from.left - to.left;
          y += from.top - to.top;
          image.section = sectionId(destination);
          selectedSection = destination;
        }
        image.positions ||= {};
        image.positions[screen()] = { x: Math.round(x), y: Math.round(y), width: parseFloat(frame.style.width) || 280 };
        placeImage(image);
        save();
      };
      frame.addEventListener("pointermove", onMove);
      frame.addEventListener("pointerup", onEnd);
      frame.addEventListener("pointercancel", onEnd);
    });
    resize.addEventListener("pointerdown", (event) => {
      if (!document.body.classList.contains("editing")) return;
      event.preventDefault();
      event.stopPropagation();
      selectImage(image);
      const startX = event.clientX;
      const startWidth = parseFloat(frame.style.width) || 280;
      resize.setPointerCapture(event.pointerId);
      const onMove = (moveEvent) => { frame.style.width = `${Math.max(80, Math.round(startWidth + moveEvent.clientX - startX))}px`; };
      const onEnd = () => {
        resize.removeEventListener("pointermove", onMove);
        resize.removeEventListener("pointerup", onEnd);
        resize.removeEventListener("pointercancel", onEnd);
        image.positions ||= {};
        image.positions[screen()] = { ...imageGeometry(image), width: parseFloat(frame.style.width) || 280 };
        save();
      };
      resize.addEventListener("pointermove", onMove);
      resize.addEventListener("pointerup", onEnd);
      resize.addEventListener("pointercancel", onEnd);
    });
  }
  state.images.forEach(mountImage);
  removeImageButton.addEventListener("click", () => imageFrames.get(selectedImage?.id)?.querySelector(".placed-image-remove")?.click());

  async function compressedImage(file) {
    const url = URL.createObjectURL(file);
    try {
      const source = new Image();
      source.src = url;
      await source.decode();
      const scale = Math.min(1, 1600 / Math.max(source.naturalWidth, source.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(source.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(source.naturalHeight * scale));
      const context = canvas.getContext("2d");
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(source, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", .82);
    } finally { URL.revokeObjectURL(url); }
  }

  async function addImage(file, section, clientX, clientY) {
    if (!file?.type.startsWith("image/")) return;
    if (state.images.length >= 12) { alert("사진은 최대 12장까지 추가할 수 있습니다."); return; }
    try {
      const src = await compressedImage(file);
      const bounds = section.getBoundingClientRect();
      const placeholder = section.querySelector(".portrait-placeholder")?.getBoundingClientRect();
      const usePlaceholder = !Number.isFinite(clientX) && placeholder;
      const width = usePlaceholder ? placeholder.width : Math.min(320, section.clientWidth * .42);
      const x = Number.isFinite(clientX) ? clientX - bounds.left - width / 2 : usePlaceholder ? placeholder.left - bounds.left : 28;
      const y = Number.isFinite(clientY) ? clientY - bounds.top - 40 : usePlaceholder ? placeholder.top - bounds.top : 90;
      const image = {
        id: crypto.randomUUID(), name: file.name, src, section: sectionId(section),
        positions: { [screen()]: { x: Math.round(x), y: Math.round(y), width: Math.round(width) } }
      };
      state.images.push(image);
      mountImage(image);
      selectImage(image);
      save();
    } catch { alert("사진을 추가할 수 없습니다. JPG 또는 PNG 파일을 다시 선택해 주세요."); }
  }

  document.addEventListener("click", (event) => {
    if (!document.body.classList.contains("editing")) return;
    const section = event.target.closest("main > section");
    if (section) selectedSection = section;
  }, true);
  tools.querySelector(".canvas-add-image").addEventListener("click", () => imageInput.click());
  imageInput.addEventListener("change", async () => {
    await addImage(imageInput.files[0], selectedSection || findSection("about"));
    imageInput.value = "";
  });
  document.addEventListener("dragover", (event) => {
    if (!document.body.classList.contains("editing") || ![...event.dataTransfer.types].includes("Files")) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
  }, true);
  document.addEventListener("drop", (event) => {
    if (!document.body.classList.contains("editing") || !event.dataTransfer.files.length) return;
    event.preventDefault();
    event.stopPropagation();
    const section = event.target.closest("main > section") || selectedSection || findSection("about");
    addImage(event.dataTransfer.files[0], section, event.clientX, event.clientY);
  }, true);
})();
