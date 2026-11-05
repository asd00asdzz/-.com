window.catalogImageUrl = (url) => {
  const parsedUrl = new URL(url, document.baseURI);
  if (!["drive.google.com", "docs.google.com"].includes(parsedUrl.hostname)) {
    return url;
  }

  const fileId = parsedUrl.pathname.match(/\/file\/d\/([^/]+)/)?.[1]
    || parsedUrl.pathname.match(/\/d\/([^/]+)/)?.[1]
    || parsedUrl.searchParams.get("id");
  if (!fileId) return url;

  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1200`;
};

window.catalogVideoUrl = (url) => {
  const parsedUrl = new URL(url, document.baseURI);
  if (!["drive.google.com", "docs.google.com"].includes(parsedUrl.hostname)) {
    return url;
  }

  const fileId = parsedUrl.pathname.match(/\/file\/d\/([^/]+)/)?.[1]
    || parsedUrl.pathname.match(/\/d\/([^/]+)/)?.[1]
    || parsedUrl.searchParams.get("id");
  if (!fileId) return url;

  return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`;
};

let forestCaptureInProgress = false;

window.showCatalogImage = (url, alt) => {
  let dialog = document.querySelector("#catalog-image-dialog");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "catalog-image-dialog";
    dialog.className = "catalog-image-dialog";

    const closeButton = document.createElement("button");
    closeButton.className = "catalog-image-dialog-close";
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "ปิดรูปสินค้า");
    closeButton.textContent = "×";
    closeButton.addEventListener("click", () => dialog.close());

    const image = document.createElement("img");
    image.className = "catalog-image-dialog-photo";
    dialog.append(closeButton, image);
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    document.body.append(dialog);
  }

  const image = dialog.querySelector(".catalog-image-dialog-photo");
  image.src = window.catalogImageUrl(url);
  image.alt = alt;
  dialog.showModal();
};

window.carryProductToContact = async (card, contact) => {
  if (forestCaptureInProgress) return;
  if (!(card instanceof HTMLElement) || !(contact instanceof HTMLElement)) {
    throw new TypeError("ต้องระบุการ์ดสินค้าและส่วนติดต่อร้าน");
  }
  forestCaptureInProgress = true;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const origin = card.getBoundingClientRect();
  const flightCard = card.cloneNode(true);
  flightCard.classList.add("forest-capture-card");
  Object.assign(flightCard.style, {
    left: `${origin.left}px`,
    top: `${origin.top}px`,
    width: `${origin.width}px`,
    height: `${origin.height}px`
  });
  document.body.append(flightCard);

  const bite = document.createElement("div");
  bite.className = "forest-bite";
  bite.setAttribute("aria-hidden", "true");
  bite.innerHTML = '<svg viewBox="0 0 220 180"><defs><linearGradient id="forest-jaw" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d9edaa"/><stop offset=".48" stop-color="#7d9d55"/><stop offset="1" stop-color="#385d46"/></linearGradient></defs><path class="forest-upper-jaw" d="M18 48 Q48 6 104 25 Q151 37 202 20 Q187 77 131 88 Q73 100 18 48Z" fill="url(#forest-jaw)" stroke="#294438" stroke-width="7" stroke-linejoin="round"/><path class="forest-lower-jaw" d="M18 132 Q57 83 112 96 Q166 108 202 157 Q145 143 103 158 Q51 174 18 132Z" fill="url(#forest-jaw)" stroke="#294438" stroke-width="7" stroke-linejoin="round"/><path d="M76 79l10 20 13-18 11 21 14-20 11 18" fill="#fff4d5" stroke="#506c4b" stroke-width="4" stroke-linejoin="round"/><path d="M73 112l12-18 12 19 12-18 13 20 12-18" fill="#fff4d5" stroke="#506c4b" stroke-width="4" stroke-linejoin="round"/><path d="M29 42Q16 17 4 14M35 138Q14 160 4 164" fill="none" stroke="#9eb66c" stroke-width="9" stroke-linecap="round"/></svg>';
  document.body.append(bite);

  const startX = origin.left + origin.width / 2;
  const startY = origin.top + origin.height / 2;
  const biteSize = Math.min(250, Math.max(150, window.innerWidth * 0.2));
  bite.style.left = `${startX}px`;
  bite.style.top = `${startY}px`;
  bite.style.width = `${biteSize}px`;
  bite.style.height = `${biteSize * 0.82}px`;

  try {
    card.classList.add("is-grabbed");
    contact.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
    await new Promise((resolve) => window.setTimeout(resolve, reducedMotion ? 120 : 850));
    const destination = contact.getBoundingClientRect();
    const deltaX = destination.left + destination.width / 2 - startX;
    const deltaY = destination.top + destination.height / 2 - startY;
    const animationDuration = reducedMotion ? 900 : 1700;
    const biteTravel = bite.animate([
      { transform: "translate(-50%, -50%) scale(.15) rotate(-18deg)", opacity: 0 },
      { transform: "translate(-50%, -50%) scale(1) rotate(0)", opacity: 1, offset: .18 },
      { transform: "translate(-50%, -50%) scale(1.04)", opacity: 1, offset: .3 },
      { transform: "translate(-50%, -50%) scale(.88)", opacity: 1, offset: .42 },
      { transform: `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(.32) rotate(14deg)`, opacity: .85 }
    ], { duration: animationDuration, easing: "cubic-bezier(.2,.72,.23,1)", fill: "forwards" });
    const cardTravel = flightCard.animate([
      { transform: "translate(0, 0) scale(1)", opacity: 1, offset: 0 },
      { transform: "translate(0, 0) scale(.9)", opacity: 1, offset: .28 },
      { transform: `translate(${deltaX}px, ${deltaY}px) scale(.12) rotate(12deg)`, opacity: .08 }
    ], { duration: animationDuration, easing: "cubic-bezier(.2,.72,.23,1)", fill: "forwards" });
    await Promise.all([biteTravel.finished, cardTravel.finished]);

    contact.classList.remove("is-forest-destination");
    void contact.offsetWidth;
    contact.classList.add("is-forest-destination");
    window.setTimeout(() => contact.classList.remove("is-forest-destination"), 900);
  } finally {
    flightCard.remove();
    bite.remove();
    card.classList.remove("is-grabbed");
    forestCaptureInProgress = false;
  }
};

window.contactProductOnLine = async (card, contact, product) => {
  if (!product || typeof product.title !== "string" || typeof product.image !== "string") {
    throw new TypeError("ต้องระบุชื่อและรูปลิงก์ของสินค้า");
  }
  if (forestCaptureInProgress) return;

  const lineMessage = `สนใจสินค้า: ${product.title}\nรูปสินค้า: ${product.image}`;
  const lineUrl = `https://line.me/R/oaMessage/%40634lfegy/?${encodeURIComponent(lineMessage)}`;

  try {
    await window.carryProductToContact(card, contact);
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    window.location.assign(lineUrl);
  } catch (error) {
    console.error("เปิดแชต LINE เพื่อสอบถามสินค้าไม่สำเร็จ", error);
    window.alert("เปิดแชต LINE ไม่สำเร็จ กรุณาลองกดสอบถามสินค้าอีกครั้ง");
  }
};

window.catalogProducts = [
  {
    category: "spearguns",
    image: "https://cdn.phototourl.com/member/2026-11-05-5aab2d29-da6b-4a64-99e8-3425465a42cc.jpg",
    alt: "เลือกทรงไม้ได้ 2 แบบ คือ VB-01 ร่องนิ้ว หรือ VB-02 มือสอด ในชุดมีปีกอลูมิเนียม ลูกดอก ยางมัดสำเร็จ",
    title: "เลือกทรงไม้ได้ 2 แบบ คือ VB-01 ร่องนิ้ว หรือ VB-02 มือสอด ในชุดมีปีกอลูมิเนียม ลูกดอก ยางมัดสำเร็จ",
    price: "1,990",
    description: " และกระบอกพร้อมสาย ราคา 1,990 บาท ส่งฟรี มีบริการเก็บเงินปลายทาง สนใจสอบถามหรือสั่งซื้อ ทักแชตได้เลย"
  },
    {
    category: "spearguns",
    image: "https://cdn.phototourl.com/member/2026-11-05-f8214c69-0ce8-4ad9-984e-fd773b853f47.jpg",
    alt: "ความยาวรวม 160 ซม. มีสีรางให้เลือก เขียว ม่วง และแดง เลือกทรงไม้ได้ 2 แบบ คือ VBS-01 ทรงร่องนิ้ว และ VBS-02 ",
    title: "ความยาวรวม 160 ซม. มีสีรางให้เลือก เขียว ม่วง และแดง เลือกทรงไม้ได้ 2 แบบ คือ VBS-01 ทรงร่องนิ้ว และ VBS-02 ",
    price: "2,490 บาท",
    description: " ทรงมือสอด ในชุดมีปีกอลูมิเนียม ลูกดอก ยางมัดสำเร็จ และกระบอกพร้อมสาย ราคา 2,490 บาท ส่งฟรี มีบริการเก็บเงินปลายทาง สนใจสอบถามหรือสั่งซื้อ ทักแชตได้เลย"
  },
      {
    category: "spearguns",
    image: "https://drive.google.com/file/d/1elFUvcqJWfsIiq4My_2IcipMMrlCnKTi/view?usp=sharing",
    alt: "ชุดมินิรางสี รุ่น VBS-M50 ไม้มะเกลือ ระยะชัก 50 ซม. ความยาวรวม 130 ซม. ระยะปลายทั้งสองด้าน 35 ซม ",
    title: "ชุดมินิรางสี รุ่น VBS-M50 ไม้มะเกลือ ระยะชัก 50 ซม. ความยาวรวม 130 ซม. ระยะปลายทั้งสองด้าน 35 ซม ",
    price: "2,990 บาท  บาท",
    description: "2,990 บาท แถมโรลเลอร์ 1 คู่ ส่งฟรี มีบริการเก็บเงินปลายทาง สนใจสอบถามหรือสั่งซื้อ ทักแชตได้เลย"
  },
   {
    category: "spearguns",
    image: "https://drive.google.com/file/d/1SrbbLF4LicRR5KtuAqlzhYj-eQMKmtOv/view?usp=sharing",
    alt: "ชุดบนรางอลูมิเนียมสี พร้อมใช้งาน เลือกได้ 3 ระยะชัก คือ 50 / 60 / 70 ซม ",
    title: "ชุดบนรางอลูมิเนียมสี พร้อมใช้งาน เลือกได้ 3 ระยะชัก คือ 50 / 60 / 70 ซม ",
    price: "1,890 บาท",
    description: "1,890 บาท ส่งฟรี มีบริการเก็บเงินปลายทาง สนใจสอบถามระยะที่ต้องการหรือสั่งซื้อ ทักแชตได้เลย"
  },
    {
    category: "spearguns",
    image: "https://drive.google.com/file/d/1kfvXOKwNi0nAHhyIO39fTKtIK2SFiRqy/view?usp=sharing",
    alt: "เลือกระยะชักได้ 2 แบบ คือ 60 หรือ 70 ซม. ความยาวรวม 160 ซม. ปีกอลูมิเนียมหนา 6 มม. ยาว 55 ซม. มีศูนย์ไฟเบอร์ออปติก ",
    title: "เลือกระยะชักได้ 2 แบบ คือ 60 หรือ 70 ซม. ความยาวรวม 160 ซม. ปีกอลูมิเนียมหนา 6 มม. ยาว 55 ซม. มีศูนย์ไฟเบอร์ออปติก  ",
    price: "2,990 บาท ",
    description: "2,990 บาท  ส่งฟรี มีบริการเก็บเงินปลายทาง สนใจสอบถามหรือสั่งซื้อ ทักแชตได้เลย"
  },
     {
    category: "spearguns",
    image: "https://drive.google.com/file/d/16K8RcTQOQklA2u4AW7lcTpqhMUOaxPvM/view?usp=sharing",
    alt: "หน้าไม้ทรงยกยิง รุ่น LM02-AL6 ความยาวรวม 140 ซม. ช่วงไม้ 60 ซม. ปีกอลูมิเนียมหนา 6 มม. ยาว 55 ซม. มีศูนย์ไฟเบอร์ออปติก ",
    title: "หน้าไม้ทรงยกยิง รุ่น LM02-AL6 ความยาวรวม 140 ซม. ช่วงไม้ 60 ซม. ปีกอลูมิเนียมหนา 6 มม. ยาว 55 ซม. มีศูนย์ไฟเบอร์ออปติก ",
    price: " 2,590 บาท ",
    description: " 2,590 บาท   ส่งฟรี มีบริการเก็บเงินปลายทาง สนใจสอบถามหรือสั่งซื้อ ทักแชตได้เลย"
  },
    {
    category: "spearguns",
    image: "https://drive.google.com/file/d/1eDBKprQ8FDDj_TSb1HH3PnZ4I9TU76My/view?usp=sharing",
    alt: " ความยาวรวม 130 ซม. ช่วงไม้ 50 ซม. ปีกอลูมิเนียมหนา 6 มม. ยาว 45 ซม. มีศูนย์ไฟเบอร์ออปติ ",
    title: " ความยาวรวม 130 ซม. ช่วงไม้ 50 ซม. ปีกอลูมิเนียมหนา 6 มม. ยาว 45 ซม. มีศูนย์ไฟเบอร์ออปติ ",
    price: " 2,590 บาท ",
    description: " 2,590 บาทส่งฟรี มีบริการเก็บเงินปลายทาง สนใจสอบถามหรือสั่งซื้อ ทักแชตได้เลย"
  },
      {
    category: "spearguns",
    image: "https://drive.google.com/file/d/1dL9DYjQlFma7qMxL--K1f_djFPkg30-5/view?usp=sharing",
    alt: " มีทรงไม้ให้เลือก S07, S32, S08 และ S99 พร้อมศูนย์เล็งเปิดข้างไฟเบอร์ออปติก ไกสแตนเลส และปีกเหล็กรมดำหนา 3 มม. ยาว 40 ซม. ",
    title: " มีทรงไม้ให้เลือก S07, S32, S08 และ S99 พร้อมศูนย์เล็งเปิดข้างไฟเบอร์ออปติก ไกสแตนเลส และปีกเหล็กรมดำหนา 3 มม. ยาว 40 ซม. ",
    price: "1,490 บาท",
    description: " 1,490 บาทส่งฟรี มีบริการเก็บเงินปลายทาง สนใจสอบถามหรือสั่งซื้อ ทักแชตได้เลย"
  },
      {
    category: "spearguns",
    image: "https://drive.google.com/file/d/1cDddw6QPAg5RloGyzFsdhkt3PX7l-fnf/view?usp=sharing",
    alt: "TS-01, TS-02 หรือ TS-03 มีศูนย์เล็งเปิดข้างไฟเบอร์ออปติก ไกสแตนเลส และปีกเหล็กรมดำหนา 3 มม. ยาว 40 ซม. แถมอุปกรณ์ครบชุดพร้อมใช้งาน ",
    title: " TS-01, TS-02 หรือ TS-03 มีศูนย์เล็งเปิดข้างไฟเบอร์ออปติก ไกสแตนเลส และปีกเหล็กรมดำหนา 3 มม. ยาว 40 ซม. แถมอุปกรณ์ครบชุดพร้อมใช้งาน ",
    price: " 1,490 บาท",
    description: "  1,490 บาท ส่งฟรี มีบริการเก็บเงินปลายทาง สนใจสอบถามหรือสั่งซื้อ ทักแชตได้เลย"
  },
        {
    category: "spearguns",
    image: "https://drive.google.com/file/d/11-_PlURWPdWHW2hE5cG65c9sEyf1QNR-/view?usp=sharing",
    alt: "แบบ: TR-01, TR-02 ทรงร่องนิ้ว หรือ TR-03 ทรงมือสอด มีไกสแตนเลส ปีกเหล็กรมดำหนา 3 มม. ยาว 40 ซม. พร้อมโรลเลอร์ 1 คู่และอุปกรณ์ครบชุดพร้อมใช้งาน  ",
    title: " แบบ: TR-01, TR-02 ทรงร่องนิ้ว หรือ TR-03 ทรงมือสอด มีไกสแตนเลส ปีกเหล็กรมดำหนา 3 มม. ยาว 40 ซม. พร้อมโรลเลอร์ 1 คู่และอุปกรณ์ครบชุดพร้อมใช้งาน  ",
    price: " 1,490 บาท",
    description: "  1,490 บาท ส่งฟรี มีบริการเก็บเงินปลายทาง สนใจสอบถามหรือสั่งซื้อ ทักแชตได้เลย"
  },
        {
    category: "spearguns",
    image: "https://drive.google.com/file/d/1nmSO0gBCpHfUi-ErA-2CcqbzM18BA7N8/view?usp=sharing",
    alt: "พร้อมรางมะเฟืองและไกเซฟล่าง ในชุดมีลูกดอก 1 ชิ้น กระบอกสาย PVC 1 ชิ้น และยางมัดสำเร็จ 1 เส้น",
    title: "พร้อมรางมะเฟืองและไกเซฟล่าง ในชุดมีลูกดอก 1 ชิ้น กระบอกสาย PVC 1 ชิ้น และยางมัดสำเร็จ 1 เส้น  ",
    price: " 1,199 บาท ",
    description: "  1,199 บาท  ส่งฟรี มีบริการเก็บเงินปลายทาง เพิ่มโรลเลอร์ได้ 290 บาท สนใจสอบถามหรือสั่งซื้อ ทักแชตได้เลย"
  },
    {
    category: "spearguns",
    image: "https://drive.google.com/file/d/1CAg0fe-E9fhO-F43j0O52iiQkwB4Z9q1/view?usp=sharing",
    alt: " มินิปืนคาร์บอน 1 ระบบ S81TK รุ่น S81TK ใช้ลูกเหล็ก 8 มม. แรงดึง 120 ปอนด์ ระยะชัก 16 ซม. ยาว 65 ซม. แถมลูกเหล็ก 50 ลูก ราค",
    title: "  มินิปืนคาร์บอน 1 ระบบ S81TK รุ่น S81TK ใช้ลูกเหล็ก 8 มม. แรงดึง 120 ปอนด์ ระยะชัก 16 ซม. ยาว 65 ซม. แถมลูกเหล็ก 50 ลูก ราคา",
    price: "2,990 บาท  ",
    description: "  2,990 บาท  ส่งฟรี มีเก็บเงินปลายทาง"
  },
      {
    category: "spearguns",
    image: "https://drive.google.com/file/d/17jlyh-RZbZr83w0pTzduTgOkqgvT4TaW/view?usp=sharing",
    alt: " มินิปืนคาร์บอน 2 ระบบ S82TK รุ่น S82TK แรงดึง 120 ปอนด์ ระยะชัก 16 ซม. ยาว 65 ซม. พร้อมกล้อง Red Dot ลูกเหล็ก50 ลูก ลูกดอก 1 ลูก และกระบอกสาย PE",
    title: "   มินิปืนคาร์บอน 2 ระบบ S82TK รุ่น S82TK แรงดึง 120 ปอนด์ ระยะชัก 16 ซม. ยาว 65 ซม. พร้อมกล้อง Red Dot ลูกเหล็ก50 ลูก ลูกดอก 1 ลูก และกระบอกสาย PE ",
    price: "3,990 บาท ",
    description: "  3,990 บาท  ส่งฟรี มีเก็บเงินปลายทาง"
  },
     {
    category: "spearguns",
    image: "https://drive.google.com/file/d/1QjUhwQ_p--eF-xLfjr0q2CrDb-wD5BoI/view?usp=sharing",
    alt: " มินิปืนคาร์บอนมี 2 ชุดให้เลือก: ราคา 3,590 บาท พร้อมกล้อง Red Dot กระบอกสาย PE และลูกดอกคาร์บอน 2 ลูก",
    title: "มินิปืนคาร์บอนมี 2 ชุดให้เลือก: ราคา 3,590 บาท พร้อมกล้อง Red Dot กระบอกสาย PE และลูกดอกคาร์บอน 2 ลูก",
    price: "3,990 บาท ",
    description: "  3,990 บาท  พร้อมที่เก็บลูกดอก รอกกระปุก กล้อง Red Dot และลูกดอกคาร์บอน 2 ลูก ส่งฟรี เก็บเงินปลายทางทั่วประเทศ"
  },
       {
    category: "spearguns",
    image: "https://drive.google.com/file/d/1G-w1mpwtYJXqWXlRLJSnNdmEX5eHDIWz/view?usp=sharing",
    alt: " มินิปืนคาร์บอน KBL02รุ่น KBL02 แกะลาย ใส่อะลูมิเนียม ยาวรวม 60 ซม. ระยะชัก 16 ซม. ลูกดอกมินิยาว 25 ซม. ปีกหนา 5 มม. ยาว 50 ซม.",
    title: "มินิปืนคาร์บอน KBL02รุ่น KBL02 แกะลาย ใส่อะลูมิเนียม ยาวรวม 60 ซม. ระยะชัก 16 ซม. ลูกดอกมินิยาว 25 ซม. ปีกหนา 5 มม. ยาว 50 ซม. ",
    price: "4,590 บาท",
    description: " 4,590 บาท   ส่งฟรี มีเก็บเงินปลายทาง"
  },
         {
    category: "spearguns",
    image: "https://drive.google.com/file/d/1x_F2AAStbDRtBWYkC26yJgLMPLtJXr4z/view?usp=sharing",
    alt: " มินิปืนคาร์บอน เลือกได้ 2 ชุด: ราคา 3,590 บาท พร้อมกล้อง Red Dot กระบอกสาย PE และลูกดอกคาร์บอน 2 ลูก หรือชุด.",
    title: "มินิปืนคาร์บอน เลือกได้ 2 ชุด: ราคา 3,590 บาท พร้อมกล้อง Red Dot กระบอกสาย PE และลูกดอกคาร์บอน 2 ลูก หรือชุด ",
    price: "3,590 บาท",
    description: "3,590 บาท ส่งฟรี มีเก็บเงินปลายทาง"
  },
      {
    category: "spearguns",
    image: "https://drive.google.com/file/d/16Ngz_eeUFHic1Cg8DeLZmj0oiL7dvx2T/view?usp=sharing",
    alt: " มินิปืนคาร์บอน รุ่น BB00 ระยะชัก 20 ซม. ยาวรวม 65 ซม. ปีกหนา 5 มม. ยาว 50 ซม. อุปกรณ์ครบชุดพร้อมใช้งาน ราคา",
    title: "มินิปืนคาร์บอน รุ่น BB00 ระยะชัก 20 ซม. ยาวรวม 65 ซม. ปีกหนา 5 มม. ยาว 50 ซม. อุปกรณ์ครบชุดพร้อมใช้งาน ราคา ",
    price: " 2,990 บาท",
    description: " 2,990 บาท ส่งฟรี มีเก็บเงินปลายทาง"
  },
  {
    category: "spearguns",
    image: "https://drive.google.com/file/d/1BoOjQMIZBv0eA6nh2IO6Ldp1YsjDssj0/view?usp=sharing",
    alt: " KTL-02 ร่องนิ้วรุ่น KTL-02 ยาวรวม 175 ซม. ระยะชัก 75 ซม. ทิ้งปลาย 45 ซม. ปีกอลูมิเนียมหนา 6 มม. ยาว 55 ซม. ด้ามจับทรงร่องนิ้วพร้อมอุปกรณ์แถม ",
    title: " KTL-02 ร่องนิ้วรุ่น KTL-02 ยาวรวม 175 ซม. ระยะชัก 75 ซม. ทิ้งปลาย 45 ซม. ปีกอลูมิเนียมหนา 6 มม. ยาว 55 ซม. ด้ามจับทรงร่องนิ้วพร้อมอุปกรณ์แถม ",
    price: " 2,990 บาท",
    description: " 2,990 บาท ส่งฟรี มีเก็บเงินปลายทาง"
  },
  {
    category: "spearguns",
    image: "https://drive.google.com/file/d/1_e8o8Yy0i9EUO0-2ppa5lS-D4gpG4pJD/view?usp=sharing",
    alt: " KTLL04 กรีดตารุ่น KTLL04 ยาวรวม 175 ซม. ระยะชัก 75 ซม. ทิ้งปลาย 45 ซม. ทรงมือสอด พร้อมลูกดอก กระบอกสายออโต้ และยางมัด ",
    title: " KTL04 กรีดตารุ่น KTL04 ยาวรวม 175 ซม. ระยะชัก 75 ซม. ทิ้งปลาย 45 ซม. ทรงมือสอด พร้อมลูกดอก กระบอกสายออโต้ และยางมัด ",
    price: " 2,990 บาท",
    description: " 2,990 บาท ส่งฟรี เก็บเงินปลายทางได้ เพิ่มปีกอลูมิเนียมแกะลาย 200 บาท"
  },
   {
    category: "spearguns",
    image: "https://drive.google.com/file/d/1KdzpzHO1VQtAIdx2l-v0DjvdyXhBnnu-/view?usp=sharing",
    alt: " รุ่น Y01 / Y02 ไม้สาธร หน้าไม้ยาวรวม 170 ซม. ระยะชัก 75 ซม. ทิ้งปลาย 45 ซม. เลือกทรงไม้ Y01 ร่องนิ้ว หรือ Y02 ทรง CZ ปีกอลูมิเนียมหนา 6 มม. ยาว 55 ซม. ราคา 3,990 บาทโอน หรือ 4,590 บาทเก็บเงินปลายทาง ส่งฟรี ",
    title: "รุ่น Y01 / Y02 ไม้สาธร หน้าไม้ยาวรวม 170 ซม. ระยะชัก 75 ซม. ทิ้งปลาย 45 ซม. เลือกทรงไม้ Y01 ร่องนิ้ว หรือ Y02 ทรง CZ ปีกอลูมิเนียมหนา 6 มม. ยาว 55 ซม. ราคา 3,990 บาทโอน หรือ 4,590 บาทเก็บเงินปลายทาง ส่งฟรี",
    price: "  3,990 บาท",
    description: "  3,990 บาท เก็บเงินปลายทาง ส่งฟรี"
  },
   {
    category: "spearguns",
    image: "https://drive.google.com/file/d/17tzKObmyv5XlkdyfbR6qoyjEB4OMN1UT/view?usp=sharing",
    alt: " รุ่น M01 มินิตัวร้ายหน้าไม้ยาวรวม 115 ซม. ระยะชัก 40 ซม. ทิ้งปลาย 27 ซม. พร้อมศูนย์ไฟเบอร์ออปติกและปีกอลูมิเนียมหนา6 มม. ยาว 55 ซม. อุปกรณ์ครบชุด ราคา",
    title: "  รุ่น M01 มินิตัวร้ายหน้าไม้ยาวรวม 115 ซม. ระยะชัก 40 ซม. ทิ้งปลาย 27 ซม. พร้อมศูนย์ไฟเบอร์ออปติกและปีกอลูมิเนียมหนา6 มม. ยาว 55 ซม. อุปกรณ์ครบชุด ราคา",
    price: " 2,990 บาท",
    description: " 2,990 บาท ส่งฟรี เก็บเงินปลายทางได้"
  },
    {
    category: "spearguns",
    image: "https://drive.google.com/file/d/1bnrCOASxmkt_wM6HnvoxrjEafSsS7Bcw/view?usp=sharing",
    alt: " รุ่นพี่ยักษ์หน้าไม้ยาวรวม 170 ซม. ระยะชัก 75 ซม. ทิ้งปลาย 45 ซม. ปีกอลูมิเนียมหนา 6 มม. ยาว 55 ซม. พร้อมอุปกรณ์ครบชุด",
    title: "  รุ่นพี่ยักษ์หน้าไม้ยาวรวม 170 ซม. ระยะชัก 75 ซม. ทิ้งปลาย 45 ซม. ปีกอลูมิเนียมหนา 6 มม. ยาว 55 ซม. พร้อมอุปกรณ์ครบชุด",
    price: " 2,990 บาท",
    description: " 2,990 บาท ส่งฟรี เก็บเงินปลายทางได้"
  },
      {
    category: "spearguns",
    image: "https://drive.google.com/file/d/1cq5ysxtUGO2s7Q0nXCIF6LCGoQrFcENE/view?usp=sharing",
    alt: "  รุ่น Z01 / Z02หน้าไม้รางอุโมงค์ชักร่องเชือก พร้อมศูนย์ไฟเบอร์ออปติกและไกเซฟสแตนเลส เลือก Z01 ยาวรวม 115 ซม. หรือ Z02ยาวรวม 130 ซม. ปีกอลูมิเนียมหนา 6 มม. ยาว 55 ซม.",
    title: "  รุ่น Z01 / Z02หน้าไม้รางอุโมงค์ชักร่องเชือก พร้อมศูนย์ไฟเบอร์ออปติกและไกเซฟสแตนเลส เลือก Z01 ยาวรวม 115 ซม. หรือ Z02ยาวรวม 130 ซม. ปีกอลูมิเนียมหนา 6 มม. ยาว 55 ซม. ",
    price: " 2,590 บาท ",
    description: " 2,590 บาท  ส่งฟรี เก็บเงินปลายทางได้"
  },
        {
    category: "rat-spearguns",
    image: "https://drive.google.com/file/d/1d49RIWzFcXgcybywj0cJp4-KKt2jAjSl/view?usp=sharing",
    alt: "   ผาเล็งหนูมีไม้ให้เลือก 4 แบบ พร้อมไกสแตนเลส แถมลูกดอกและยางมัดสำเร็จ ราคา",
    title: "   ผาเล็งหนูมีไม้ให้เลือก 4 แบบ พร้อมไกสแตนเลส แถมลูกดอกและยางมัดสำเร็จ ราคา ",
    price: "  999 บาท",
    description: "  999 บาท ส่งฟรี เก็บเงินปลายทางได้"
  },
          {
    category: "rat-spearguns",
    image: "https://drive.google.com/file/d/15-X4GpjHY7CvrlEN17GDYbp7-xJpV-mC/view?usp=sharing",
    alt: " F4-01 อลูมิเนียมโครงอลูมิเนียมทั้งตัว ความยาวรวม 80 ซม. ระยะชัก 45 ซม. แถมลูกดอกยิงหนูและยางมัดสำเร็จ",
    title: " F4-01 อลูมิเนียมโครงอลูมิเนียมทั้งตัว ความยาวรวม 80 ซม. ระยะชัก 45 ซม. แถมลูกดอกยิงหนูและยางมัดสำเร็จ",
    price: "  2,990 บาท ",
    description: "  2,990 บาท  ส่งฟรี เก็บเงินปลายทางได้"
  },
     {
    category: "rat-spearguns",
    image: "https://drive.google.com/file/d/1dcxJGPcenLue5HF_pOzKkFBxEXhkCbJq/view?usp=sharing",
    alt: " PNY-01 ไม้ประดู่ความยาวรวม 80 ซม. ระยะชัก 50 ซม. แถมลูกดอกและยางมัดสำเร็จ",
    title: " PNY-01 ไม้ประดู่ความยาวรวม 80 ซม. ระยะชัก 50 ซม. แถมลูกดอกและยางมัดสำเร็จ",
    price: "  1,290 บาท ",
    description: "  1,290 บาท ส่งฟรี เก็บเงินปลายทางได้"
  },
       {
    category: "rat-spearguns",
    image: "https://drive.google.com/file/d/1i9vlVweCSeQO1FgFO5RCpGvO1xribIn1/view?usp=sharing",
    alt: "PN-01 / PN-02เลือกไม้ประดู่ PN-01 หรือไม้มะเกลือ PN-02 ความยาวรวม 90 ซม. ระยะชัก 55 ซม. แถมลูกดอก ยางมัดสำเร็จ และขาจับเลเซอร์สแตนเลส ราคาปลีก 1,690 บาท ราคาส่ง 1,250 บาท",
    title: "  PN-01 / PN-02เลือกไม้ประดู่ PN-01 หรือไม้มะเกลือ PN-02 ความยาวรวม 90 ซม. ระยะชัก 55 ซม. แถมลูกดอก ยางมัดสำเร็จ และขาจับเลเซอร์สแตนเลส ราคาปลีก 1,690 บาท ราคาส่ง 1,250 บาท",
    price: "  1,690 บาทท ",
    description: "  1,690 บาท ส่งฟรี เก็บเงินปลายทางได้"
  },
        {
    category: "accessories",
    image: "https://drive.google.com/file/d/1ccIuVhuYJdj-v_SGpARzsBvq8m4b3zWy/view?usp=sharing",
    alt: "กระบอกสายพร้อมขาจับกระบอกสายพร้อมขาจับ มีให้เลือกตามแบบในภาพ",
    title: "  กระบอกสายพร้อมขาจับกระบอกสายพร้อมขาจับ มีให้เลือกตามแบบในภาพ",
    price: " คลิกติดต่อแอดมิน ",
    description: "  คลิกติดต่อแอดมิน ส่งฟรี เก็บเงินปลายทางได้"
  },
         {
    category: "accessories",
    image: "https://drive.google.com/file/d/1ucixrGrrS6NEPOGF91AVnpJk5XC2C9UA/view?usp=sharing",
    alt: "ล็อกออโต้เกรด 304 ขนาด 7 × 8 ซม. ประกอบงานช่า",
    title: "  ล็อกออโต้เกรด 304 ขนาด 7 × 8 ซม. ประกอบงานช่า",
    price: " คลิกติดต่อแอดมิน ",
    description: "  คลิกติดต่อแอดมิน ส่งฟรี เก็บเงินปลายทางได้"
  },
          {
    category: "accessories",
    image: "https://drive.google.com/file/d/1DZj0gb4JA3p3bGgxTiBQGleWVgAdPYEv/view?usp=sharing",
    alt: "ไกสแตนเลสเกรด 304 ขนาด 7 × 8 ซม.",
    title: "  ไกสแตนเลสเกรด 304 ขนาด 7 × 8 ซม.",
    price: " คลิกติดต่อแอดมิน ",
    description: "  คลิกติดต่อแอดมิน ส่งฟรี เก็บเงินปลายทางได้"
  },
   {
    category: "accessories",
    image: "https://drive.google.com/file/d/1V6scPFQY5oWJDPjYvm6e16ryWXLRAgo3/view?usp=sharing",
    alt: "ชุดศูนย์พร้อมใช้งาน ประกอบด้วยศูนย์หน้าและศูนย์หลัง",
    title: "  ชุดศูนย์พร้อมใช้งาน ประกอบด้วยศูนย์หน้าและศูนย์หลัง",
    price: " คลิกติดต่อแอดมิน ",
    description: "  คลิกติดต่อแอดมิน ส่งฟรี เก็บเงินปลายทางได้"
  },
    {
    category: "accessories",
    image: "https://drive.google.com/file/d/1VzyyPevexLtqEuL4sM2SS0cuZcIhFm4I/view?usp=sharing",
    alt: "ไกระมังเซฟบน แบบล็อกบน ผลิตจากสแตนเลสเกรด 304 ราคา 390 บา",
    title: "  ไกระมังเซฟบน แบบล็อกบน ผลิตจากสแตนเลสเกรด 304 ราคา 390 บาท",
    price: " ราคา 390 บาท ",
    description: "  ราคา 390 บาท ส่งฟรี เก็บเงินปลายทางได้"
  },
    {
    category: "shafts",
    image: "https://drive.google.com/file/d/1oaaIrtzT10VJWrykSYDcxlEgYaYj4dq9/view?usp=sharing",
    alt: "ลูกดอกยิงหนู ขนาด 70 × 45 มม. เชื่อมทองเหลืองทุกจุด คมจัด ลูกละ 100 บาท จากปกติ 150 บาท",
    title: " ลูกดอกยิงหนู ขนาด 70 × 45 มม. เชื่อมทองเหลืองทุกจุด คมจัด ลูกละ 100 บาท จากปกติ 150 บาท",
    price: " ราคา 390 บาท ",
    description: "  ราคา 100 บาท ส่งฟรี เก็บเงินปลายทางได้"
  },
];
