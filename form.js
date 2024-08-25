(function () {
  "use strict";
  if (typeof window < "u" && typeof window.vismeForms > "u") {
    const s = {
      constants: { mode: { INLINE: "inline", FULL_PAGE: "fullPage" } },
      iframeId: 1,
      forms: [],
      flags: {
        isInitialized: !1,
        isInitOnReadyFired: !1,
        shouldBeShown: !1,
        shouldBePreloaded: !1,
      },
      initOnReady() {
        s.flags.isInitOnReadyFired || s.onInit(window, s.init);
      },
      onInit(e, t) {
        if (
          e.document &&
          (e.document.readyState === "complete" ||
            e.document.readyState === "interactive")
        ) {
          t();
          return;
        }
        if ((s.addEvent(e, "load", t), !e.document)) return;
        s.addEvent(e.document, "DOMContentLoaded", t);
        const o = function () {
          e.document.readyState === "complete" && t();
        };
        s.addEvent(e.document, "readystatechange", o);
      },
      init() {
        s.flags.isInitialized ||
          ((s.flags.isInitialized = !0),
          s.setupVisme(),
          s.addEvent(window, "message", s.onMessageHandler, !1));
      },
      getWidth() {
        return "100%";
      },
      getHeight(e) {
        return e ? "100vh" : "100%";
      },
      getStyle(e) {
        let t = "border: none; max-width: 100%; ";
        return (
          e &&
            (t +=
              "position: fixed; z-index: 999999; top: 0; left: 0; background: rgba(255, 255, 255, 0.78); "),
          t
        );
      },
      async getSettings({ vismeDiv: e, formId: t, origin: r }) {
        if (t && r) {
          const d =
            e.getAttribute("data-full-page") === "true" ? "?type=fullPage" : "";
          try {
            const l = await (
              await fetch(`${r}/ajax/forms/settings/${t}${d}`)
            ).json();
            if (l?.settings) return JSON.parse(l.settings);
          } catch (i) {
            console.warn("VISME_FORMS: Error fetching popup settings.", i);
          }
        } else
          console.warn(
            "VISME_FORMS: Popup settings are not loaded. Please update your embed code."
          );
        if (e.getAttribute("data-trigger-page-load"))
          return { afterPageLoad: !0 };
        if (e.getAttribute("data-trigger-user-interaction"))
          return { afterUserInteraction: !0 };
        const o = parseInt(e.getAttribute("data-trigger-scroll"));
        if (!Number.isNaN(o)) return { afterScrollDown: o };
        if (e.getAttribute("data-trigger-leave")) return { beforeLeave: !0 };
        const n = parseInt(e.getAttribute("data-trigger-timer"));
        return Number.isNaN(n) ? null : { afterTime: n };
      },
      addOnUserInteractionListener(e, t) {
        const r = [
            "keydown",
            "mousedown",
            "mousemove",
            "touchmove",
            "touchstart",
            "touchend",
            "wheel",
          ],
          o = () => {
            if (s.flags[t]) {
              console.warn(
                "VISME_FORMS: onUserInteraction callback already fired"
              );
              return;
            }
            e(), (s.flags[t] = !0);
          };
        r.forEach((n) => {
          document.addEventListener(n, o, { once: !0 });
        });
      },
      popupHandlers: {
        onAfterTime(e, t) {
          setTimeout(() => {
            t();
          }, e * 1e3);
        },
        onPageScroll(e, t) {
          const r = document.documentElement.scrollHeight - window.innerHeight,
            o = (n) => {
              const d = r * (n / 100),
                i = () => {
                  window.scrollY >= d &&
                    (t(), window.removeEventListener("scroll", i));
                };
              window.addEventListener("scroll", i);
            };
          r <= 0 ? t() : o(e);
        },
        onUserInteraction(e) {
          s.addOnUserInteractionListener(e, "shouldBeShown");
        },
        onPageLeave(e) {
          document.body.addEventListener("mouseleave", e, { once: !0 });
        },
      },
      setPopupListener(e, t) {
        const r = e.settings;
        if (r?.afterPageLoad || !r) {
          t();
          return;
        }
        const {
            afterUserInteraction: o,
            afterScrollDown: n,
            beforeLeave: d,
            afterTime: i,
          } = r,
          { popupHandlers: l } = s;
        i
          ? l.onAfterTime(i, t)
          : n
          ? l.onPageScroll(n, t)
          : o
          ? l.onUserInteraction(t)
          : d && l.onPageLeave(t);
      },
      defineEmbedMode(e) {
        const { INLINE: t, FULL_PAGE: r } = s.constants.mode;
        return e.getAttribute("data-full-page") === "true" ? r : t;
      },
      isDivTopEdgeInViewport(e) {
        const t = window.innerHeight || document.documentElement.clientHeight,
          r = e.getBoundingClientRect();
        return r.top >= 0 && r.top <= t;
      },
      loadPopup(e) {
        s.createIframe(e, !0);
        const t = () => {
          const r = s.getFormByIframeId(e.iframeId);
          if (!r.ref) {
            console.warn("VISME_FORMS: form.ref not found");
            return;
          }
          (r.ref.style.opacity = 1),
            (r.ref.style.zIndex = 999999),
            r.ref.contentWindow.postMessage(
              { type: "vismeForms:play", id: e.formId },
              "*"
            ),
            s.increaseNumberOfVisits(e.formId),
            s.updateLastVisit(e.formId);
        };
        s.setPopupListener(e, t);
      },
      async getVismeDivsForSetup() {
        const e = document.getElementsByClassName("visme_d"),
          t = [];
        for (const r of e) {
          const o = r.getAttribute("data-form-id") || "",
            n = r.getAttribute("data-full-page") === "true",
            d = s.getOrigin(r),
            i = s.defineEmbedMode(r),
            l = {
              vismeDiv: r,
              width: s.getWidth(),
              height: s.getHeight(n),
              style: s.getStyle(n),
              origin: d,
              formId: o,
              mode: i,
              iframeId: this.iframeId,
              settings: null,
            },
            c =
              t.some((a) => a.formId === o) && i === s.constants.mode.FULL_PAGE;
          o &&
            !c &&
            (t.push(l),
            s.forms.push({
              formId: o,
              ref: null,
              mode: i,
              iframeId: this.iframeId,
            }),
            this.iframeId++);
        }
        for (const r of t) {
          const { vismeDiv: o, formId: n, origin: d } = r,
            i = await s.getSettings({ vismeDiv: o, formId: n, origin: d });
          r.settings = i || null;
        }
        return t;
      },
      async setupVisme() {
        (await s.getVismeDivsForSetup()).forEach(async (t) => {
          const r = t.mode === s.constants.mode.FULL_PAGE;
          let o = !0;
          if (t.settings?.showing)
            switch (t.settings.showing.type) {
              case "everySession": {
                o = !!!window.sessionStorage.getItem(
                  `vismeforms_${t.formId}_closed`
                );
                break;
              }
              case "submission": {
                o = !!!window.localStorage.getItem(
                  `vismeforms_${t.formId}_submitted`
                );
                break;
              }
              case "closingForm": {
                o = !!!window.localStorage.getItem(
                  `vismeforms_${t.formId}_closed`
                );
                break;
              }
              case "visit": {
                o = s.getNumberOfVisits(t.formId) < t.settings.showing.value;
                break;
              }
              case "onceEvery": {
                const n = { hours: 36e5, days: 864e5, weeks: 6048e5 },
                  d =
                    parseInt(
                      window.localStorage.getItem(
                        `vismeforms_${t.formId}_lastVisit`
                      )
                    ) || 0,
                  [i, l] = t.settings.showing.value.split("*");
                d && i && l && (o = Date.now() > d + parseInt(i) * n[l]);
                break;
              }
              case "everyVisit":
              case "always":
              default:
                break;
            }
          if (r && !o) {
            console.warn(
              "VISME_FORMS: Full page form not shown because of showing settings"
            );
            return;
          }
          if (t.settings?.afterPageLoad) {
            r ? s.loadPopup(t) : s.createIframe(t);
            return;
          }
          if (r) {
            s.addOnUserInteractionListener(() => {
              s.loadPopup(t);
            }, `shouldBePreloaded-${t.mode}-${t.iframeId}`);
            return;
          }
          if (s.isDivTopEdgeInViewport(t.vismeDiv)) {
            s.createIframe(t);
            return;
          }
          s.addOnUserInteractionListener(() => {
            s.createIframe(t);
          }, `shouldBePreloaded-${t.mode}-${t.iframeId}`);
        });
      },
      getOrigin(e) {
        return `https://${e.getAttribute("data-domain") || "my"}.visme.co`;
      },
      addEvent(e, t, r) {
        e.addEventListener && e.addEventListener(t, r, !1);
      },
      getFormByIframeId(e) {
        return s.forms.find((t) => t.iframeId === e);
      },
      getFormByIdAndMode(e, t) {
        return s.forms.find((r) => r.formId === e && r.mode === t);
      },
      createIframe(
        {
          vismeDiv: e,
          width: t,
          height: r,
          style: o,
          iframeId: n,
          mode: d,
          origin: i,
        },
        l = !1
      ) {
        const c = s.getFormByIframeId(n);
        if (!c || c.ref) return;
        const a = document.createElement("IFRAME"),
          f =
            "/formsPlayer/_embed/" +
            e.getAttribute("data-url") +
            "?embedIframeId=" +
            n;
        (a.style.cssText = o),
          (a.style.minHeight = e.getAttribute("data-min-height")),
          (a.style.width = t),
          (a.style.height = r),
          (a.style.border = "none"),
          l &&
            ((a.style.transition = "opacity 0.2s"),
            (a.style.opacity = 0),
            (a.style.zIndex = -999)),
          a.setAttribute("webkitallowfullscreen", !0),
          a.setAttribute("mozallowfullscreen", !0),
          a.setAttribute("allowfullScreen", !0),
          a.setAttribute("scrolling", "no"),
          a.setAttribute("src", i + f),
          a.setAttribute("title", e.getAttribute("data-title")),
          d === s.constants.mode.INLINE && a.setAttribute("loading", "lazy"),
          (a.className = "vismeForms"),
          e.parentNode.replaceChild(a, e),
          (c.ref = a);
      },
      onMessageHandler(e) {
        if (e.origin.indexOf("visme") === -1) return;
        const t = e.data.type,
          r = e.data.id;
        if (t === "vismeForms:shouldClose") {
          const o = s.getFormByIdAndMode(r, s.constants.mode.FULL_PAGE);
          o?.ref.parentNode.removeChild(o.ref),
            window.sessionStorage.setItem(`vismeforms_${r}_closed`, "true"),
            window.localStorage.setItem(`vismeforms_${r}_closed`, "true");
        }
        if (
          (t === "vismeForms:submitSuccess" &&
            window.localStorage.setItem(`vismeforms_${r}_submitted`, "true"),
          t === "vismeForms:formRectUpdated")
        ) {
          const o = s.getFormByIframeId(parseInt(e.data.iframeId));
          if (!o || o.iframeSizeAdjusted) return;
          const n = JSON.parse(e.data.data.formRect),
            d = 500,
            i = 600;
          (o.ref.style.minHeight =
            Math.min(Math.max(n.height, d), i) +
            Number(e.data.data.badgeHeight) +
            "px"),
            (o.iframeSizeAdjusted = !0);
        }
        if (t === "vismeForms:redirectUser") {
          const { url: o } = e.data;
          window.location.href = o;
        }
      },
      getNumberOfVisits(e) {
        return (
          parseInt(window.localStorage.getItem(`vismeforms_${e}_visits`)) || 0
        );
      },
      increaseNumberOfVisits(e) {
        const t = s.getNumberOfVisits(e);
        window.localStorage.setItem(`vismeforms_${e}_visits`, t + 1);
      },
      updateLastVisit(e) {
        window.localStorage.setItem(`vismeforms_${e}_lastVisit`, Date.now());
      },
    };
    (window.vismeForms = s), s.initOnReady();
  }
})();
