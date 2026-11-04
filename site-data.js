window.loadSiteData = async () => {
  try {
    const response = await fetch("/api/public", { headers: { Accept: "application/json" } });
    if (response.status === 404) return;
    if (!response.ok) throw new Error(`โหลดข้อมูลจากเซิร์ฟเวอร์ไม่สำเร็จ (${response.status})`);
    const shared = await response.json();

    if (Array.isArray(shared.products)) {
      window.catalogProducts = shared.products;
    }

    if (shared.settings) {
      const settings = shared.settings;
      const originalName = "ธนากรฟิชชิ่ง";
      if (settings.siteName) {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let textNode;
        while ((textNode = walker.nextNode())) {
          if (textNode.nodeValue.includes(originalName)) {
            textNode.nodeValue = textNode.nodeValue.replaceAll(originalName, settings.siteName);
          }
        }
        document.title = document.title.replaceAll(originalName, settings.siteName);
        for (const selector of [
          'meta[name="description"]',
          'meta[name="keywords"]',
          'meta[property="og:site_name"]',
          'meta[property="og:title"]',
          'meta[property="og:description"]',
          'meta[property="og:image:alt"]'
        ]) {
          const meta = document.querySelector(selector);
          if (meta) meta.content = meta.content.replaceAll(originalName, settings.siteName);
        }
      }

      if (settings.logoUrl) {
        document.querySelectorAll(".brand-mark").forEach((image) => {
          image.src = settings.logoUrl;
        });
      }

      if (settings.heroImageUrl) {
        document.querySelectorAll(".hero, .catalog-hero").forEach((hero) => {
          hero.style.backgroundImage = `linear-gradient(90deg, rgba(17,17,17,.72), rgba(17,17,17,.36)), url("${settings.heroImageUrl.replaceAll('"', "%22")}")`;
          hero.style.backgroundPosition = "center";
          hero.style.backgroundSize = "cover";
        });
      }
    }
  } catch (error) {
    console.error("โหลดข้อมูลเว็บไซต์ล่าสุดไม่สำเร็จ", error);
    const notice = document.createElement("p");
    notice.setAttribute("role", "status");
    notice.style.cssText = "margin:12px auto;padding:10px 16px;max-width:1120px;color:#8a1c1c;background:#fff0f0";
    notice.textContent = "โหลดข้อมูลล่าสุดไม่สำเร็จ อาจกำลังแสดงข้อมูลสำรอง";
    document.body.prepend(notice);
  }
};
