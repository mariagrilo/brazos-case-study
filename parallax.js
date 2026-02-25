(() => {
  const dashboardVideo = document.querySelector('.dashboard-video');
  const scrollSpacer = document.querySelector('.scroll-spacer');
  const logo = document.querySelector('.brazos-logo');
  const tagline = document.querySelector('.tagline');
  const isometric = document.querySelector('.isometric');

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }

  // Fixed target positions in viewport coordinates, computed once.
  let logoTargetTop = 0;
  let logoStartTop = 0;
  let taglineTargetTop = 0;

  function computeLayout() {
    if (!dashboardVideo || !logo) return;
    const dashRect = dashboardVideo.getBoundingClientRect();
    const dashCenterY = dashRect.top + dashRect.height / 2;
    const logoH = logo.offsetHeight;

    logoTargetTop = dashCenterY - logoH / 2 - 100;
    logoStartTop = window.innerHeight + 50;
    taglineTargetTop = logoTargetTop + logoH + 40;
  }

  function animate() {
    // On mobile/tablet, logo and tagline are static in the flow — skip parallax
    if (window.innerWidth <= 1024) return;

    const spacerRect = scrollSpacer.getBoundingClientRect();
    const viewportH = window.innerHeight;

    const totalTravel = spacerRect.height + viewportH;
    const traveled = viewportH - spacerRect.top;
    const progress = clamp(traveled / totalTravel, 0, 1);

    // Phase 1 (0–0.35): Logo slides from below to its target position
    // Phase 2 (0.2–0.5): Tagline fades in and slides up
    // Phase 3 (0.6–0.85): Both logo and tagline fade out completely
    const phase1 = clamp(progress / 0.35, 0, 1);
    const phase2 = clamp((progress - 0.2) / 0.3, 0, 1);
    const phase3 = clamp((progress - 0.6) / 0.25, 0, 1);

    // Dashboard fade
    const fadeProg = clamp((phase1 - 0.3) / 0.7, 0, 1);
    dashboardVideo.style.opacity = 1 - easeOutCubic(fadeProg);

    const easedPhase1 = easeOutCubic(phase1);
    const easedPhase2 = easeOutCubic(phase2);
    const easedPhase3 = easeOutCubic(phase3);

    // Logo
    const logoBase = logoStartTop + (logoTargetTop - logoStartTop) * easedPhase1;
    const logoExitOffset = easedPhase3 * -150;
    logo.style.top = (logoBase + logoExitOffset) + 'px';
    // Fade in during phase1, then fully out during phase3
    const logoOpacity = phase1 > 0 ? Math.max(0, 1 - easedPhase3) : 0;
    logo.style.opacity = logoOpacity;

    // Tagline
    const taglineBase = taglineTargetTop + 60 * (1 - easedPhase2);
    const taglineExitOffset = easedPhase3 * -150;
    tagline.style.top = (taglineBase + taglineExitOffset) + 'px';
    const taglineOpacity = Math.max(0, easedPhase2 * (1 - easedPhase3));
    tagline.style.opacity = taglineOpacity;
  }

  // Scroll handler
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        animate();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener('resize', () => {
    computeLayout();
    animate();
  });

  // Compute layout after page fully loads (fonts, images, etc.)
  window.addEventListener('load', () => {
    window.scrollTo(0, 0);
    computeLayout();
    animate();
  });
  // Also compute immediately as fallback
  computeLayout();
  animate();

  // --- Testimonial video play/pause ---
  const testimonialCard = document.querySelector('.testimonial-video');
  const playBtn = document.querySelector('.play-button');
  const testimonialVideo = document.querySelector('.testimonial-video-player');
  const videoOverlay = document.querySelector('.video-overlay');
  const overlayPlayer = document.querySelector('.video-overlay-player');

  if (testimonialCard && playBtn && testimonialVideo) {
    function toggleTestimonialVideo() {
      // On mobile: open overlay with rotate hint (horizontal video)
      if (window.innerWidth <= 1024 && videoOverlay && overlayPlayer) {
        overlayPlayer.src = testimonialVideo.querySelector('source')?.src || testimonialVideo.src;
        videoOverlay.classList.add('active', 'show-rotate');
        videoOverlay.setAttribute('aria-hidden', 'false');
        overlayPlayer.currentTime = 0;
        overlayPlayer.play();
        return;
      }
      // Desktop: inline play/pause
      if (testimonialVideo.paused) {
        testimonialVideo.play();
        testimonialVideo.style.opacity = '1';
        playBtn.style.opacity = '0';
      } else {
        testimonialVideo.pause();
        testimonialVideo.style.opacity = '0.5';
        playBtn.style.opacity = '1';
      }
    }
    testimonialCard.addEventListener('click', toggleTestimonialVideo);
    testimonialVideo.addEventListener('ended', () => {
      testimonialVideo.currentTime = 0;
      testimonialVideo.style.opacity = '0.5';
      playBtn.style.opacity = '1';
    });
  }

  // --- Video overlay: close on click ---
  if (videoOverlay && overlayPlayer) {
    videoOverlay.addEventListener('click', () => {
      overlayPlayer.pause();
      overlayPlayer.currentTime = 0;
      videoOverlay.classList.remove('active', 'show-rotate');
      videoOverlay.setAttribute('aria-hidden', 'true');
    });
  }

  // --- Section 2 entrance animations ---
  // Each element animates individually when it enters the top 2/3 of the viewport
  // (i.e. when it's 1/3 of the screen from the bottom)
  const quoteContainer = document.querySelector('.quote-container');
  const testimonialContainer = document.querySelector('.testimonial-video');

  const isMobile = window.innerWidth <= 1024;
  const s2Observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      const el = entry.target;
      if (entry.isIntersecting) {
        if (el === testimonialContainer) el.classList.add('visible');
        if (el === quoteContainer) el.classList.add('visible');
        if (el === isometric) el.classList.add('iso-animate');
        if (isMobile) observer.unobserve(el);
      } else if (!isMobile) {
        if (el === testimonialContainer) el.classList.remove('visible');
        if (el === quoteContainer) el.classList.remove('visible');
        if (el === isometric) el.classList.remove('iso-animate');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -25% 0px'
  });

  if (testimonialContainer) s2Observer.observe(testimonialContainer);
  if (quoteContainer) s2Observer.observe(quoteContainer);
  if (isometric) s2Observer.observe(isometric);

  // --- Section 3 entrance animations (scroll-based) ---
  const section3 = document.querySelector('.section-3');
  const s3Article = document.querySelector('.s3-article');
  const s3Composition = document.querySelector('.s3-composition');
  const s3Content = document.querySelector('.section-3-content');


  // --- SVG line-draw animation setup ---
  const svgContainer = document.querySelector('.s3-interface-svg');
  let svgPaths = [];
  let svgReady = false;

  function loadSvgInline() {
    if (!svgContainer) return;
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'assets/oldinterface.svg', true);
    xhr.onload = function () {
      if (xhr.status === 200 || xhr.status === 0) { // status 0 for file:// protocol
        svgContainer.innerHTML = xhr.responseText;
        const svg = svgContainer.querySelector('svg');
        if (svg) {
          svg.style.width = '100%';
          svg.style.height = '100%';
        }
        // Prepare stroked elements for draw animation
        const allEls = svgContainer.querySelectorAll('path, rect, circle, ellipse, line, polyline, polygon');
        allEls.forEach((el) => {
          const stroke = el.getAttribute('stroke');
          if (stroke && stroke !== 'none') {
            try {
              const len = el.getTotalLength();
              el.style.strokeDasharray = len;
              el.style.strokeDashoffset = len;
              svgPaths.push({ el, len });
            } catch (e) {}
          }
        });
        // Hide fills initially
        const allFills = svgContainer.querySelectorAll('[fill]:not([fill="none"])');
        allFills.forEach((el) => {
          const fill = el.getAttribute('fill');
          if (fill && fill !== 'none' && fill !== 'transparent') {
            el.dataset.originalFill = fill;
            el.setAttribute('fill', 'transparent');
          }
        });
        svgReady = true;
      }
    };
    xhr.send();
  }
  loadSvgInline();

  function triggerSvgDraw() {
    if (!svgReady || !svgContainer) return;
    svgPaths.forEach(({ el }, i) => {
      const delay = Math.min(i * 10, 1500);
      el.style.transition = `stroke-dashoffset 2s ease-out ${delay}ms`;
      el.style.strokeDashoffset = '0';
    });
    const allFills = svgContainer.querySelectorAll('[data-original-fill]');
    allFills.forEach((el) => {
      el.style.transition = 'fill 0.8s ease-out 1.8s';
      el.setAttribute('fill', el.dataset.originalFill);
    });
  }

  function resetSvgDraw() {
    if (!svgReady || !svgContainer) return;
    svgPaths.forEach(({ el, len }) => {
      el.style.transition = 'none';
      el.style.strokeDashoffset = len;
    });
    const allFills = svgContainer.querySelectorAll('[data-original-fill]');
    allFills.forEach((el) => {
      el.style.transition = 'none';
      el.setAttribute('fill', 'transparent');
    });
  }

  if (section3 && s3Content) {
    // Article + composition: triggers as soon as section enters viewport
    let s3Visible = false;
    function checkS3Entrance() {
      const contentRect = s3Content.getBoundingClientRect();
      const inView = contentRect.top < window.innerHeight && contentRect.bottom > 0;
      if (inView && !s3Visible) {
        s3Visible = true;
        if (s3Article) setTimeout(() => s3Article.classList.add('visible'), 100);
        if (s3Composition) setTimeout(() => s3Composition.classList.add('visible'), 400);
        setTimeout(() => triggerSvgDraw(), 400);
      } else if (!inView && s3Visible && !isMobile) {
        s3Visible = false;
        if (s3Article) s3Article.classList.remove('visible');
        if (s3Composition) s3Composition.classList.remove('visible');
        resetSvgDraw();
      }
    }
    window.addEventListener('scroll', checkS3Entrance, { passive: true });
    checkS3Entrance();

    // Video card + quote: fade in individually once a bit on screen
    const s3VideoCard = document.querySelector('.s3-video-card');
    const s3QuoteContainer = document.querySelector('.s3-quote-container');
    const s3ElObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          if (isMobile) observer.unobserve(entry.target);
        } else if (!isMobile) {
          entry.target.classList.remove('visible');
        }
      });
    }, { threshold: 0.15 });
    if (s3VideoCard) s3ElObserver.observe(s3VideoCard);
    if (s3QuoteContainer) s3ElObserver.observe(s3QuoteContainer);
  }

  // --- Section 3 video play/pause ---
  const s3PlayBtn = document.querySelector('.s3-play-button');
  const s3Video = document.querySelector('.s3-video-player');
  const s3VideoCard = document.querySelector('.s3-video-card');
  if (s3VideoCard && s3PlayBtn && s3Video) {
    function toggleS3Video() {
      // On mobile: open overlay without rotate hint (landscape video)
      if (window.innerWidth <= 1024 && videoOverlay && overlayPlayer) {
        overlayPlayer.src = s3Video.querySelector('source')?.src || s3Video.src;
        videoOverlay.classList.remove('show-rotate');
        videoOverlay.classList.add('active');
        videoOverlay.setAttribute('aria-hidden', 'false');
        overlayPlayer.currentTime = 0;
        overlayPlayer.play();
        return;
      }
      // Desktop: inline play/pause
      if (s3Video.paused) {
        s3Video.play();
        s3Video.style.opacity = '1';
        s3PlayBtn.style.opacity = '0';
      } else {
        s3Video.pause();
        s3Video.style.opacity = '0.5';
        s3PlayBtn.style.opacity = '1';
      }
    }
    s3VideoCard.addEventListener('click', toggleS3Video);
    s3Video.addEventListener('ended', () => {
      s3Video.currentTime = 0;
      s3Video.style.opacity = '0.5';
      s3PlayBtn.style.opacity = '1';
    });
  }

  // --- Section 4: Entrance animations (top to bottom stagger) ---
  const section4 = document.querySelector('.section-4');
  const s4Header = document.querySelector('.s4-article-header');
  const s4Chart = document.querySelector('.s4-chart');
  const s4Expandables = document.querySelector('.s4-expandables');

  if (section4) {
    if (window.innerWidth <= 1024) {
      // Mobile: observe each element individually
      const s4ElObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
      if (s4Header) s4ElObserver.observe(s4Header);
      if (s4Chart) s4ElObserver.observe(s4Chart);
      if (s4Expandables) s4ElObserver.observe(s4Expandables);
    } else {
      // Desktop: staggered timing on section enter
      const s4Observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (s4Header) setTimeout(() => s4Header.classList.add('visible'), 400);
            if (s4Chart) setTimeout(() => s4Chart.classList.add('visible'), 800);
            if (s4Expandables) setTimeout(() => s4Expandables.classList.add('visible'), 1200);
          } else {
            if (s4Header) s4Header.classList.remove('visible');
            if (s4Chart) s4Chart.classList.remove('visible');
            if (s4Expandables) s4Expandables.classList.remove('visible');
          }
        });
      }, { threshold: 0.15 });
      s4Observer.observe(section4);
    }
  }

  // --- Section 5: Entrance animations ---
  const section5 = document.querySelector('.section-5');
  const s5VideoCard = document.querySelector('.s5-video-card');
  const s5Right = document.querySelector('.s5-right');

  if (section5) {
    if (window.innerWidth <= 1024) {
      // Mobile: observe each element individually
      const s5Header = document.querySelector('.s5-article-header');
      const s5Quote = document.querySelector('.s5-quote-container');
      const s5Author = document.querySelector('.s5-quote-author');
      const s5ElObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });
      if (s5Header) s5ElObserver.observe(s5Header);
      if (s5VideoCard) s5ElObserver.observe(s5VideoCard);
      if (s5Quote) s5ElObserver.observe(s5Quote);
      if (s5Author) s5ElObserver.observe(s5Author);
      if (s5Right) s5ElObserver.observe(s5Right);
    } else {
      const s5Observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (s5VideoCard) setTimeout(() => s5VideoCard.classList.add('visible'), 400);
            if (s5Right) setTimeout(() => s5Right.classList.add('visible'), 700);
          } else {
            if (s5VideoCard) s5VideoCard.classList.remove('visible');
            if (s5Right) s5Right.classList.remove('visible');
          }
        });
      }, { threshold: 0.15 });
      s5Observer.observe(section5);
    }
  }

  // --- Section 5: Video play/pause ---
  const s5PlayBtn = document.querySelector('.s5-play-button');
  const s5Video = document.querySelector('.s5-video-player');
  if (s5VideoCard && s5PlayBtn && s5Video) {
    function toggleS5Video() {
      // On mobile: open overlay (vertical video, no rotate hint)
      if (window.innerWidth <= 1024 && videoOverlay && overlayPlayer) {
        overlayPlayer.src = s5Video.querySelector('source')?.src || s5Video.src;
        videoOverlay.classList.remove('show-rotate');
        videoOverlay.classList.add('active');
        videoOverlay.setAttribute('aria-hidden', 'false');
        overlayPlayer.currentTime = 0;
        overlayPlayer.play();
        return;
      }
      // Desktop: inline play/pause
      if (s5Video.paused) {
        s5Video.play();
        s5Video.style.opacity = '1';
        s5PlayBtn.style.opacity = '0';
      } else {
        s5Video.pause();
        s5Video.style.opacity = '0.5';
        s5PlayBtn.style.opacity = '1';
      }
    }
    s5VideoCard.addEventListener('click', toggleS5Video);
    s5Video.addEventListener('ended', () => {
      s5Video.currentTime = 0;
      s5Video.style.opacity = '0.5';
      s5PlayBtn.style.opacity = '1';
    });
  }

  // --- Section 6: Entrance animations ---
  const s6Text = document.querySelector('.s6-text');
  const s6Screenshots = document.querySelector('.s6-screenshots');
  const section6 = document.querySelector('.section-6');

  let s6EntranceDone = !isMobile; // on desktop, no guard needed

  if (section6) {
    const s6EntranceObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (isMobile) {
            // On mobile, .s6-text has display:contents — animate children individually
            if (s6ArticleHeader) setTimeout(() => s6ArticleHeader.classList.add('visible'), 400);
            if (s6BodyStates) setTimeout(() => s6BodyStates.classList.add('visible'), 600);
            if (s6Screenshots) setTimeout(() => s6Screenshots.classList.add('visible'), 700);
            // Mark entrance done after the longest delay completes
            setTimeout(() => { s6EntranceDone = true; }, 900);
            observer.unobserve(entry.target);
          } else {
            if (s6Text) setTimeout(() => s6Text.classList.add('visible'), 400);
            if (s6Screenshots) setTimeout(() => s6Screenshots.classList.add('visible'), 700);
          }
        } else if (!isMobile) {
          if (s6Text) s6Text.classList.remove('visible');
          if (s6Screenshots) s6Screenshots.classList.remove('visible');
        }
      });
    }, { threshold: 0.1 });
    s6EntranceObserver.observe(section6);
  }

  // --- Section 6: Scroll-driven storytelling ---
  const s6Container = document.querySelector('.s6-scroll-container');
  const s6Article = document.querySelector('.s6-article');
  const s6ArticleHeader = document.querySelector('.s6-article-header');
  const s6BodyStates = document.querySelector('.s6-body-states');
  const s6Statement = document.querySelector('.s6-statement');
  const s6Bodies = document.querySelectorAll('.s6-body');
  const s6Shot1 = document.querySelector('.s6-shot-1');
  const s6Shot2 = document.querySelector('.s6-shot-2');
  const s6Shot3 = document.querySelector('.s6-shot-3');

  if (s6Container) {
    function updateSection6() {
      const rect = s6Container.getBoundingClientRect();
      const scrollableHeight = rect.height - window.innerHeight;
      // progress: 0 at top, 1 when sticky releases
      const progress = Math.min(1, Math.max(0, -rect.top / scrollableHeight));

      // --- Text transitions ---
      // Compressed into first 65%, statement holds 65–80%, everything fades out 82–92%
      // 0.00–0.20: body 1 (hold)
      // 0.20–0.24: body 1 out
      // 0.24–0.28: body 2 in
      // 0.28–0.44: body 2 (hold)
      // 0.44–0.48: body 2 out
      // 0.48–0.52: body 3 in
      // 0.52–0.60: body 3 (hold)
      // 0.60–0.64: article out
      // 0.64–0.68: statement in
      // 0.68–0.75: statement (hold)
      // 0.75–0.82: everything fades out
      // 0.82–1.00: empty (buffer before next section)

      const transitions = [
        { outStart: 0.20, outEnd: 0.24, inStart: 0.24, inEnd: 0.28 }, // body 0 → body 1
        { outStart: 0.44, outEnd: 0.48, inStart: 0.48, inEnd: 0.52 }, // body 1 → body 2
      ];

      function getBodyState(bodyIndex) {
        let opacity = 0;
        let ty = 20;

        if (bodyIndex === 0) {
          if (progress < transitions[0].outStart) {
            opacity = 1; ty = 0;
          } else if (progress < transitions[0].outEnd) {
            const p = (progress - transitions[0].outStart) / (transitions[0].outEnd - transitions[0].outStart);
            opacity = 1 - p; ty = 0;
          }
        } else if (bodyIndex === 1) {
          if (progress < transitions[0].inStart) {
            opacity = 0; ty = 20;
          } else if (progress < transitions[0].inEnd) {
            const p = (progress - transitions[0].inStart) / (transitions[0].inEnd - transitions[0].inStart);
            opacity = p; ty = 20 * (1 - p);
          } else if (progress < transitions[1].outStart) {
            opacity = 1; ty = 0;
          } else if (progress < transitions[1].outEnd) {
            const p = (progress - transitions[1].outStart) / (transitions[1].outEnd - transitions[1].outStart);
            opacity = 1 - p; ty = 0;
          }
        } else if (bodyIndex === 2) {
          if (progress < transitions[1].inStart) {
            opacity = 0; ty = 20;
          } else if (progress < transitions[1].inEnd) {
            const p = (progress - transitions[1].inStart) / (transitions[1].inEnd - transitions[1].inStart);
            opacity = p; ty = 20 * (1 - p);
          } else if (progress < 0.60) {
            opacity = 1; ty = 0;
          } else if (progress < 0.64) {
            const p = (progress - 0.60) / 0.04;
            opacity = 1 - p; ty = 0;
          }
        }
        return { opacity, ty };
      }

      // Determine which body gets position: relative (for layout height)
      let activeBody = 0;
      if (progress < 0.24) activeBody = 0;
      else if (progress < 0.48) activeBody = 1;
      else activeBody = 2;

      s6Bodies.forEach((body, i) => {
        const state = getBodyState(i);
        body.style.opacity = state.opacity;
        body.style.transform = `translateY(${state.ty}px)`;
        if (i === activeBody) {
          body.classList.add('active');
          body.style.position = 'relative';
        } else {
          body.classList.remove('active');
          body.style.position = 'absolute';
        }
      });

      // Article vs statement transition
      // On mobile, .s6-article has display:contents so setting its opacity
      // has no effect. Instead fade .s6-article-header and .s6-body-states individually.
      function setArticleOpacity(val) {
        if (isMobile) {
          // Don't override entrance animation until it's finished
          if (!s6EntranceDone && val >= 1) return;
          if (s6ArticleHeader) s6ArticleHeader.style.opacity = val;
          if (s6BodyStates) s6BodyStates.style.opacity = val;
        } else {
          s6Article.style.opacity = val;
        }
      }

      // On mobile: slide header+screenshots up, center statement below screenshots
      const mobileSlideAmount = 80; // px to slide up

      function setMobileSlideUp(amount) {
        if (!isMobile || !s6EntranceDone) return;
        if (s6ArticleHeader) s6ArticleHeader.style.transform = 'translateY(-' + amount + 'px)';
        if (s6Screenshots) s6Screenshots.style.transform = 'translateY(-' + amount + 'px)';
      }

      const mobileHeader = isMobile ? document.querySelector('.header') : null;

      function positionMobileStatement() {
        if (!isMobile || !s6Screenshots || !s6Statement) return;
        const screenshotsRect = s6Screenshots.getBoundingClientRect();
        const screenshotBottom = screenshotsRect.bottom;
        // Bottom boundary = top edge of the fixed bottom nav header
        const headerTop = mobileHeader ? mobileHeader.getBoundingClientRect().top : window.innerHeight;
        const availableSpace = headerTop - screenshotBottom;
        const statementH = s6Statement.offsetHeight;
        const centeredTop = screenshotBottom + (availableSpace - statementH) / 2 - 40;
        s6Statement.style.top = centeredTop + 'px';
      }

      if (progress < 0.60) {
        setArticleOpacity(1);
        s6Statement.style.opacity = 0;
        if (isMobile) {
          setMobileSlideUp(0);
        } else {
          s6Statement.style.transform = 'translateY(20px)';
        }
      } else if (progress < 0.64) {
        const p = (progress - 0.60) / 0.04;
        setArticleOpacity(1 - p);
        s6Statement.style.opacity = 0;
        if (isMobile) {
          setMobileSlideUp(p * mobileSlideAmount);
        } else {
          s6Statement.style.transform = 'translateY(20px)';
        }
      } else if (progress < 0.68) {
        const p = (progress - 0.64) / 0.04;
        setArticleOpacity(0);
        s6Statement.style.opacity = p;
        if (isMobile) {
          setMobileSlideUp(mobileSlideAmount);
          positionMobileStatement();
        } else {
          s6Statement.style.transform = 'translateY(' + (20 * (1 - p)) + 'px)';
        }
      } else if (progress < 0.75) {
        setArticleOpacity(0);
        s6Statement.style.opacity = 1;
        if (isMobile) {
          setMobileSlideUp(mobileSlideAmount);
          positionMobileStatement();
        } else {
          s6Statement.style.transform = 'translateY(0)';
        }
      } else if (progress < 0.82) {
        const fadeP = (progress - 0.75) / 0.07;
        setArticleOpacity(0);
        s6Statement.style.opacity = 1 - fadeP;
        if (isMobile) {
          setMobileSlideUp(mobileSlideAmount);
          positionMobileStatement();
        } else {
          s6Statement.style.transform = 'translateY(0)';
        }
      } else {
        setArticleOpacity(0);
        s6Statement.style.opacity = 0;
        if (isMobile) setMobileSlideUp(mobileSlideAmount);
      }

      // --- Screenshot transitions ---
      // Shots 1 & 2 compressed so shot 3 stays longer (covers body 3 + statement)
      // 0.00–0.14: shot 1 (hold)
      // 0.14–0.26: shot 2 slides up, shot 1 fades
      // 0.26–0.34: shot 2 (hold)
      // 0.34–0.48: shot 3 slides up, shot 2 fades
      // 0.48–0.75: shot 3 (hold)
      // 0.75–0.82: shot 3 fades out

      // Shot 2 slide-up
      if (progress < 0.14) {
        s6Shot2.style.transform = 'translateY(100%)';
        s6Shot1.style.opacity = '1';
        s6Shot1.style.pointerEvents = 'auto';
        s6Shot2.style.pointerEvents = 'none';
        s6Shot3.style.pointerEvents = 'none';
      } else if (progress < 0.26) {
        const p = (progress - 0.14) / 0.12;
        s6Shot2.style.transform = `translateY(${(1 - p) * 100}%)`;
        s6Shot1.style.opacity = String(1 - p);
        s6Shot1.style.pointerEvents = 'none';
        s6Shot2.style.pointerEvents = 'auto';
        s6Shot3.style.pointerEvents = 'none';
      } else {
        s6Shot2.style.transform = 'translateY(0)';
        s6Shot1.style.opacity = '0';
        s6Shot1.style.pointerEvents = 'none';
      }

      // Shot 3 slide-up
      if (progress < 0.34) {
        s6Shot3.style.transform = 'translateY(100%)';
        s6Shot2.style.opacity = '1';
        s6Shot2.style.pointerEvents = 'auto';
        s6Shot3.style.pointerEvents = 'none';
      } else if (progress < 0.48) {
        const p = (progress - 0.34) / 0.14;
        s6Shot3.style.transform = `translateY(${(1 - p) * 100}%)`;
        s6Shot2.style.opacity = String(1 - p);
        s6Shot2.style.pointerEvents = 'none';
        s6Shot3.style.pointerEvents = 'auto';
      } else {
        s6Shot3.style.transform = 'translateY(0)';
        s6Shot2.style.opacity = '0';
        s6Shot2.style.pointerEvents = 'none';
        s6Shot3.style.pointerEvents = 'auto';
      }

      // Fade out shot 3 at the end (matches statement fade)
      if (progress < 0.75) {
        s6Shot3.style.opacity = '1';
      } else if (progress < 0.82) {
        const fadeP = (progress - 0.75) / 0.07;
        s6Shot3.style.opacity = String(1 - fadeP);
      } else {
        s6Shot3.style.opacity = '0';
        s6Shot3.style.pointerEvents = 'none';
      }
    }

    window.addEventListener('scroll', () => {
      requestAnimationFrame(updateSection6);
    }, { passive: true });
    updateSection6(); // initial state
  }

  // --- Section 6: Screenshot/video click → fullscreen overlay (mobile) ---
  // These screenshots will become videos. On click, open in overlay with rotate hint (horizontal videos).
  if (isMobile) {
    const s6Shots = document.querySelectorAll('.s6-screenshot');
    s6Shots.forEach((shot) => {
      shot.style.cursor = 'pointer';
      shot.addEventListener('click', () => {
        if (!videoOverlay || !overlayPlayer) return;
        // Support <video> elements or elements with data-video attribute
        let videoSrc = '';
        if (shot.tagName === 'VIDEO') {
          videoSrc = shot.querySelector('source')?.src || shot.src;
        } else if (shot.dataset.video) {
          videoSrc = shot.dataset.video;
        }
        if (!videoSrc) return;
        overlayPlayer.src = videoSrc;
        videoOverlay.classList.add('active', 'show-rotate');
        videoOverlay.setAttribute('aria-hidden', 'false');
        overlayPlayer.currentTime = 0;
        overlayPlayer.play();
      });
    });
  }

  // --- Section 7: Sitemap parallax + entrance + fade-out ---
  const s7Container = document.querySelector('.s7-scroll-container');
  const s7Sitemap = document.querySelector('.s7-sitemap');
  const s7ContentEl = document.querySelector('.s7-content');
  const section7 = document.querySelector('.section-7');

  let s7EntranceFired = false;
  let s7EntranceComplete = false;

  var s7IsPhone = window.innerWidth < 600;
  if (s7Container && s7Sitemap) {
    if (s7IsPhone) {
      // Mobile (phone only): sticky content that pins from bottom, parallax into S8.
      var s7VideoCardEl = document.querySelector('.s7-video-card');
      var s7QuoteEl = document.querySelector('.s7-quote-container');
      var s7AuthorEl = document.querySelector('.s7-quote-author');
      var s7StickyEl = document.querySelector('.s7-sticky');

      // Set sticky top so content pins when its bottom clears the mobile nav bar.
      // The mobile nav sits ~80px from viewport bottom (46px bar + 16px margin + padding).
      // top = -(contentHeight - viewportHeight + navBarSpace)
      var mobileNavSpace = 112;
      function setS7StickyTop() {
        if (!s7StickyEl) return;
        var stickyH = s7StickyEl.offsetHeight;
        var vh = window.innerHeight;
        var topVal = Math.min(0, vh - stickyH - mobileNavSpace);
        s7StickyEl.style.top = topVal + 'px';
      }
      setS7StickyTop();
      window.addEventListener('resize', setS7StickyTop);

      // Entrance fade-in
      var s7ContentObs = new IntersectionObserver(function(entries, observer) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
      if (s7VideoCardEl) s7ContentObs.observe(s7VideoCardEl);
      if (s7QuoteEl) s7ContentObs.observe(s7QuoteEl);
      if (s7AuthorEl) s7ContentObs.observe(s7AuthorEl);
    } else {
      // Desktop/Tablet: scroll-driven sitemap parallax + entrance + fade-out
      // On tablet, override mobile CSS opacity:1!important via JS
      if (s7ContentEl && window.innerWidth <= 1024) {
        s7ContentEl.style.setProperty('opacity', '0', 'important');
      }
      function updateSection7() {
        const rect = s7Container.getBoundingClientRect();
        const vh = window.innerHeight;
        const scrollableHeight = rect.height - vh;
        const progress = Math.min(1, Math.max(0, -rect.top / scrollableHeight));

        // Trigger entrance when the section top enters the viewport
        const inView = rect.top < vh && rect.bottom > 0;
        var isTablet = window.innerWidth >= 600 && window.innerWidth <= 1024;
        function setS7Opacity(el, val) {
          if (isTablet) {
            el.style.setProperty('opacity', String(val), 'important');
          } else {
            el.style.opacity = String(val);
          }
        }

        if (!s7EntranceFired && inView) {
          s7EntranceFired = true;
          if (s7Sitemap) setTimeout(() => s7Sitemap.classList.add('visible'), 200);
          if (s7ContentEl) setTimeout(() => {
            s7ContentEl.classList.add('visible');
            setS7Opacity(s7ContentEl, 1);
            s7EntranceComplete = true;
          }, 500);
        } else if (!inView && s7EntranceFired) {
          s7EntranceFired = false;
          s7EntranceComplete = false;
          if (s7Sitemap) s7Sitemap.classList.remove('visible');
          if (s7ContentEl) {
            s7ContentEl.classList.remove('visible');
            setS7Opacity(s7ContentEl, 0);
          }
        }

        // Sitemap slides up across the full scroll
        const sitemapHeight = s7Sitemap.naturalHeight || 1211;
        const maxShift = sitemapHeight - vh;
        s7Sitemap.style.transform = `translateY(${-progress * maxShift}px)`;

        // Fade out content at the end (only after entrance is done)
        // On tablet (shorter scroll), fade earlier so content is gone before S8 overlaps
        var s7FadeStart = isTablet ? 0.45 : 0.72;
        var s7FadeEnd = isTablet ? 0.62 : 0.85;
        var s7FadeRange = s7FadeEnd - s7FadeStart;
        if (s7EntranceComplete && s7ContentEl) {
          if (progress < s7FadeStart) {
            setS7Opacity(s7ContentEl, 1);
          } else if (progress < s7FadeEnd) {
            const fadeP = (progress - s7FadeStart) / s7FadeRange;
            setS7Opacity(s7ContentEl, 1 - fadeP);
          } else {
            setS7Opacity(s7ContentEl, 0);
          }
        }

        // Fade out sitemap too
        if (s7Sitemap.classList.contains('visible')) {
          if (progress < s7FadeStart) {
            s7Sitemap.style.opacity = '0.9';
          } else if (progress < s7FadeEnd) {
            const fadeP = (progress - s7FadeStart) / s7FadeRange;
            s7Sitemap.style.opacity = String(0.9 * (1 - fadeP));
          } else {
            s7Sitemap.style.opacity = '0';
          }
        }
      }

      window.addEventListener('scroll', () => {
        requestAnimationFrame(updateSection7);
      }, { passive: true });
      updateSection7();
    }
  }

  // Section 7: Video play/pause
  const s7VideoCard = document.querySelector('.s7-video-card');
  const s7PlayBtn = document.querySelector('.s7-play-button');
  const s7Video = document.querySelector('.s7-video-player');
  const s7Poster = document.querySelector('.s7-video-poster');
  if (s7VideoCard && s7PlayBtn && s7Video) {
    function toggleS7Video() {
      // Mobile: open in fullscreen overlay (vertical video, no rotate)
      if (window.innerWidth <= 1024 && videoOverlay && overlayPlayer) {
        overlayPlayer.src = s7Video.querySelector('source')?.src || s7Video.src;
        videoOverlay.classList.remove('show-rotate');
        videoOverlay.classList.add('active');
        videoOverlay.setAttribute('aria-hidden', 'false');
        overlayPlayer.currentTime = 0;
        overlayPlayer.play();
        return;
      }
      if (s7Video.paused) {
        s7Video.play();
        s7Video.style.opacity = '1';
        if (s7Poster) s7Poster.style.opacity = '0';
        s7PlayBtn.style.opacity = '0';
      } else {
        s7Video.pause();
        s7Video.style.opacity = '0';
        if (s7Poster) s7Poster.style.opacity = '0.5';
        s7PlayBtn.style.opacity = '1';
      }
    }
    s7VideoCard.addEventListener('click', toggleS7Video);
    s7Video.addEventListener('ended', () => {
      s7Video.currentTime = 0;
      s7Video.style.opacity = '0';
      if (s7Poster) s7Poster.style.opacity = '0.5';
      s7PlayBtn.style.opacity = '1';
    });
  }

  // --- Section 4: Expandable boxes ---
  const expandBoxes = document.querySelectorAll('.s4-expand-box');
  expandBoxes.forEach((box) => {
    const header = box.querySelector('.s4-expand-header');
    if (header) {
      header.addEventListener('click', () => {
        const isOpen = box.classList.contains('open');
        // Close all other boxes
        expandBoxes.forEach((b) => {
          b.classList.remove('open');
          const h = b.querySelector('.s4-expand-header');
          if (h) h.setAttribute('aria-expanded', 'false');
        });
        // Toggle the clicked one
        if (!isOpen) {
          box.classList.add('open');
          header.setAttribute('aria-expanded', 'true');
          // Scroll down so expanded content is visible
          setTimeout(() => {
            const boxRect = box.getBoundingClientRect();
            const boxBottom = boxRect.bottom + window.scrollY + 80;
            const viewportBottom = window.scrollY + window.innerHeight;
            if (boxBottom > viewportBottom) {
              window.scrollTo({ top: boxBottom - window.innerHeight, behavior: 'smooth' });
            }
          }, 450);
        }
      });
    }
  });

  // --- Section 8: Line chart SVG animation setup ---
  const s8LineChart = document.querySelector('.s8-line-chart');
  if (s8LineChart) {
    // Set stroke-dasharray for each vertical line
    const vLines = s8LineChart.querySelectorAll('.s8-vlines line');
    vLines.forEach((line, i) => {
      const y1 = parseFloat(line.getAttribute('y1'));
      const y2 = parseFloat(line.getAttribute('y2'));
      const len = Math.abs(y2 - y1);
      line.style.setProperty('--line-len', len);
    });
    // Mark ready — lines are now properly offset and can be made visible
    requestAnimationFrame(() => s8LineChart.classList.add('ready'));

    // Pin the SVG position using top so it doesn't shift when dropdowns expand
    const s8Expandables2 = document.querySelector('.s8-expandables');
    const s8Inner = document.querySelector('.s8-inner');
    if (s8Expandables2 && s8Inner) {
      const expandTop = s8Expandables2.offsetTop;
      const expandHeight = s8Expandables2.offsetHeight;
      const chartHeight = s8LineChart.offsetHeight || 533;
      // Align SVG bottom with dropdown bottom (collapsed state)
      s8LineChart.style.top = (expandTop + expandHeight - chartHeight) + 'px';
    }
  }

  // --- Section 8: Entrance animations ---
  const section8 = document.querySelector('.section-8');
  const s8Header = document.querySelector('.s8-header');
  const s8Article = document.querySelector('.s8-article');
  const s8Expandables = document.querySelector('.s8-expandables');

  if (section8) {
    const s8Observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (s8Header) setTimeout(() => s8Header.classList.add('visible'), 400);
          if (s8Article) setTimeout(() => s8Article.classList.add('visible'), 800);
          if (s8Expandables) setTimeout(() => s8Expandables.classList.add('visible'), 1200);
          if (s8LineChart) setTimeout(() => s8LineChart.classList.add('animate'), 1600);
        } else {
          if (s8Header) s8Header.classList.remove('visible');
          if (s8Article) s8Article.classList.remove('visible');
          if (s8Expandables) s8Expandables.classList.remove('visible');
          if (s8LineChart) s8LineChart.classList.remove('animate');
        }
      });
    }, { threshold: 0.1 });
    s8Observer.observe(section8);
  }

  // --- Section 8: Expandable boxes ---
  document.querySelectorAll('.s8-expand-header').forEach((header) => {
    header.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      const targetId = this.getAttribute('data-target');
      const box = document.getElementById(targetId);
      if (!box) return;
      const isOpen = box.classList.contains('open');
      // Close all other boxes
      document.querySelectorAll('.s8-expand-box').forEach((b) => {
        b.classList.remove('open');
        const h = b.querySelector('.s8-expand-header');
        if (h) h.setAttribute('aria-expanded', 'false');
      });
      // Toggle the clicked one
      if (!isOpen) {
        box.classList.add('open');
        this.setAttribute('aria-expanded', 'true');
        // Scroll down so expanded content is visible with 80px breathing room
        setTimeout(() => {
          const boxRect = box.getBoundingClientRect();
          const boxBottom = boxRect.bottom + window.scrollY + 80;
          const viewportBottom = window.scrollY + window.innerHeight;
          if (boxBottom > viewportBottom) {
            window.scrollTo({ top: boxBottom - window.innerHeight, behavior: 'smooth' });
          }
        }, 450);
      }
    });
  });

  // --- Section 8: Video play/pause ---
  const s8VideoCard = document.querySelector('.s8-video-card');
  const s8PlayBtn = document.querySelector('.s8-play-button');
  const s8Video = document.querySelector('.s8-video-player');
  const s8Poster = document.querySelector('.s8-video-poster');
  if (s8VideoCard && s8PlayBtn && s8Video) {
    function toggleS8Video() {
      if (isMobile && videoOverlay && overlayPlayer) {
        overlayPlayer.src = s8Video.querySelector('source')?.src || s8Video.src;
        videoOverlay.classList.remove('show-rotate');
        videoOverlay.classList.add('active');
        videoOverlay.setAttribute('aria-hidden', 'false');
        overlayPlayer.currentTime = 0;
        overlayPlayer.play();
        return;
      }
      if (s8Video.paused) {
        s8Video.play();
        s8Video.style.opacity = '1';
        if (s8Poster) s8Poster.style.opacity = '0';
        s8PlayBtn.style.opacity = '0';
      } else {
        s8Video.pause();
        s8Video.style.opacity = '0';
        if (s8Poster) s8Poster.style.opacity = '0.5';
        s8PlayBtn.style.opacity = '1';
      }
    }
    s8VideoCard.addEventListener('click', toggleS8Video);
    s8Video.addEventListener('ended', () => {
      s8Video.currentTime = 0;
      s8Video.style.opacity = '0';
      if (s8Poster) s8Poster.style.opacity = '0.5';
      s8PlayBtn.style.opacity = '1';
    });
  }

  // --- Section 9: How It Works — scroll-driven storytelling ---
  const s9Container = document.querySelector('.s9-scroll-container');
  const s9Header = document.querySelector('.s9-header');
  const s9Features = document.querySelector('.s9-features');
  const s9ImgDash = document.querySelector('.s9-img-dashboard');
  const s9ImgEvent = document.querySelector('.s9-img-event');
  const s9ImgReports = document.querySelector('.s9-img-reports');
  const s9Subtitle = document.querySelector('.s9-text-subtitle');
  const s9FeatDash = document.querySelector('.s9-feature-dashboard');
  const s9FeatEvent = document.querySelector('.s9-feature-event');
  const s9FeatReports = document.querySelector('.s9-feature-reports');
  const s9ClosingQuote = document.querySelector('.s9-closing-quote');

  if (s9Container && isMobile) {
    // === MOBILE S9: scroll-driven storytelling (vertical stacked layout) ===
    var s9ImagesEl = document.querySelector('.s9-images');
    var s9TextEl = document.querySelector('.s9-text');
    var s9Layout = {};

    // Reparent subtitle: move it from inside .s9-text to .s9-features
    // so it can be absolutely positioned relative to .s9-features
    var s9FeaturesEl = document.querySelector('.s9-features');
    if (s9FeaturesEl && s9Subtitle) {
      s9FeaturesEl.appendChild(s9Subtitle);
    }

    var s9IsTablet = window.innerWidth >= 600;

    function calcS9Layout() {
      var vh = window.innerHeight;
      var contentW = s9FeaturesEl ? s9FeaturesEl.offsetWidth : (window.innerWidth - 32);
      var vw = window.innerWidth;

      if (s9IsTablet) {
        // Tablet layout: features has 40px gutters each side
        var subtitleTop = 100;
        var imgW = vw - 80;
        var imgTop = 167;
        var imgH = Math.round(imgW * (496 / 696));
        var textTop = imgTop + imgH + 64;
      } else {
        // Phone layout: tighter spacing, smaller image
        var subtitleTop = Math.min(48, Math.max(32, (vw - 320) * (48 - 32) / (480 - 320) + 32));
        var subtitleH = s9Subtitle ? s9Subtitle.offsetHeight : 48;
        var gap = Math.min(64, Math.max(16, (vw - 320) * (64 - 16) / (480 - 320) + 16));
        var imgTop = subtitleTop + subtitleH + gap;
        var imgH = Math.round(contentW * (205 / 288));
        var textTop = imgTop + imgH + gap;
      }

      s9Layout.vh = vh;
      s9Layout.imgTop = imgTop;
      s9Layout.imgH = imgH;
      s9Layout.textTop = textTop;

      // Apply static positions
      if (s9ImagesEl) {
        s9ImagesEl.style.top = imgTop + 'px';
        s9ImagesEl.style.height = imgH + 'px';
      }
      if (s9TextEl) {
        s9TextEl.style.top = textTop + 'px';
      }
    }
    calcS9Layout();
    window.addEventListener('resize', calcS9Layout);

    function updateSection9Mobile() {
      var rect = s9Container.getBoundingClientRect();
      var vh = s9Layout.vh || window.innerHeight;
      var scrollableHeight = rect.height - vh;
      var progress = Math.min(1, Math.max(0, -rect.top / scrollableHeight));

      // Mobile phase mapping (9 frames over scroll):
      // 0.00–0.08  Frame 1: Intro header centered
      // 0.08–0.16  Frame 2: Header fades/scrolls up, features slide in
      // 0.16–0.28  Frame 3: Dashboard hold
      // 0.28–0.36  Frame 4: Dashboard→Event crossfade
      // 0.36–0.50  Frame 5: Event hold
      // 0.50–0.58  Frame 6: Event→Reports crossfade
      // 0.58–0.74  Frame 7: Reports hold
      // 0.74–0.86  Frame 8: Everything exits, closing quote fades in
      // 0.86–1.00  Frame 9: Closing quote centered

      // === HEADER ===
      if (progress < 0.04) {
        s9Header.style.opacity = '1';
        s9Header.style.transform = s9IsTablet ? 'none' : 'translateY(calc(-50% - 40px))';
      } else if (progress < 0.12) {
        var t = (progress - 0.04) / 0.08;
        s9Header.style.opacity = String(1 - t);
        s9Header.style.transform = s9IsTablet
          ? 'translateY(' + (-t * 150) + 'px)'
          : 'translateY(calc(-50% - 40px - ' + (t * 150) + 'px))';
      } else {
        s9Header.style.opacity = '0';
      }

      // === FEATURES CONTAINER ===
      if (progress < 0.10) {
        s9Features.style.opacity = '0';
        s9Features.style.transform = 'translateY(80px)';
      } else if (progress < 0.16) {
        var t = (progress - 0.10) / 0.06;
        s9Features.style.opacity = String(t);
        s9Features.style.transform = 'translateY(' + (80 - t * 80) + 'px)';
      } else if (progress < 0.74) {
        s9Features.style.opacity = '1';
        s9Features.style.transform = 'translateY(0)';
      } else if (progress < 0.86) {
        var t = (progress - 0.74) / 0.12;
        s9Features.style.opacity = String(1 - t);
        s9Features.style.transform = 'translateY(' + (-t * 200) + 'px)';
      } else {
        s9Features.style.opacity = '0';
      }

      // === SUBTITLE ===
      if (progress < 0.12) {
        s9Subtitle.style.opacity = '0';
      } else if (progress < 0.16) {
        var t = (progress - 0.12) / 0.04;
        s9Subtitle.style.opacity = String(t);
      } else if (progress < 0.74) {
        s9Subtitle.style.opacity = '1';
      } else {
        s9Subtitle.style.opacity = '0';
      }

      // === DASHBOARD IMAGE ===
      var imgH = s9Layout.imgH || 205;
      if (progress < 0.10) {
        s9ImgDash.style.opacity = '0';
        s9ImgDash.style.top = imgH + 'px';
      } else if (progress < 0.16) {
        var t = (progress - 0.10) / 0.06;
        s9ImgDash.style.opacity = String(t);
        s9ImgDash.style.top = (imgH - t * imgH) + 'px';
      } else if (progress < 0.28) {
        s9ImgDash.style.opacity = '1';
        s9ImgDash.style.top = '0';
      } else if (progress < 0.36) {
        var t = (progress - 0.28) / 0.08;
        s9ImgDash.style.opacity = String(1 - t);
        s9ImgDash.style.top = '0';
      } else {
        s9ImgDash.style.opacity = '0';
      }

      // === DASHBOARD TEXT ===
      if (progress < 0.12) {
        s9FeatDash.style.opacity = '0';
      } else if (progress < 0.16) {
        var t = (progress - 0.12) / 0.04;
        s9FeatDash.style.opacity = String(t);
      } else if (progress < 0.26) {
        s9FeatDash.style.opacity = '1';
      } else if (progress < 0.32) {
        var t = (progress - 0.26) / 0.06;
        s9FeatDash.style.opacity = String(1 - t);
      } else {
        s9FeatDash.style.opacity = '0';
      }

      // === EVENT IMAGE ===
      if (progress < 0.28) {
        s9ImgEvent.style.opacity = '0';
        s9ImgEvent.style.top = imgH + 'px';
      } else if (progress < 0.36) {
        var t = (progress - 0.28) / 0.08;
        s9ImgEvent.style.opacity = String(t);
        s9ImgEvent.style.top = (imgH - t * imgH) + 'px';
      } else if (progress < 0.50) {
        s9ImgEvent.style.opacity = '1';
        s9ImgEvent.style.top = '0';
      } else if (progress < 0.58) {
        var t = (progress - 0.50) / 0.08;
        s9ImgEvent.style.opacity = String(1 - t);
        s9ImgEvent.style.top = '0';
      } else {
        s9ImgEvent.style.opacity = '0';
      }

      // === EVENT TEXT ===
      if (progress < 0.30) {
        s9FeatEvent.style.opacity = '0';
      } else if (progress < 0.36) {
        var t = (progress - 0.30) / 0.06;
        s9FeatEvent.style.opacity = String(t);
      } else if (progress < 0.48) {
        s9FeatEvent.style.opacity = '1';
      } else if (progress < 0.54) {
        var t = (progress - 0.48) / 0.06;
        s9FeatEvent.style.opacity = String(1 - t);
      } else {
        s9FeatEvent.style.opacity = '0';
      }

      // === REPORTS IMAGE ===
      if (progress < 0.50) {
        s9ImgReports.style.opacity = '0';
        s9ImgReports.style.top = imgH + 'px';
      } else if (progress < 0.58) {
        var t = (progress - 0.50) / 0.08;
        s9ImgReports.style.opacity = String(t);
        s9ImgReports.style.top = (imgH - t * imgH) + 'px';
      } else if (progress < 0.70) {
        s9ImgReports.style.opacity = '1';
        s9ImgReports.style.top = '0';
      } else if (progress < 0.78) {
        var t = (progress - 0.70) / 0.08;
        s9ImgReports.style.opacity = String(1 - t);
        s9ImgReports.style.top = '0';
      } else {
        s9ImgReports.style.opacity = '0';
        s9ImgReports.style.top = '0';
      }

      // === REPORTS TEXT ===
      if (progress < 0.52) {
        s9FeatReports.style.opacity = '0';
      } else if (progress < 0.58) {
        var t = (progress - 0.52) / 0.06;
        s9FeatReports.style.opacity = String(t);
      } else if (progress < 0.70) {
        s9FeatReports.style.opacity = '1';
      } else if (progress < 0.78) {
        var t = (progress - 0.70) / 0.08;
        s9FeatReports.style.opacity = String(1 - t);
      } else {
        s9FeatReports.style.opacity = '0';
      }

      // === CLOSING QUOTE ===
      var quoteCenter = vh / 2;
      if (progress < 0.78) {
        s9ClosingQuote.style.opacity = '0';
        s9ClosingQuote.style.top = '';
        s9ClosingQuote.style.bottom = '0';
      } else if (progress < 0.86) {
        var t = (progress - 0.78) / 0.08;
        s9ClosingQuote.style.opacity = String(t);
        s9ClosingQuote.style.bottom = '';
        s9ClosingQuote.style.top = (vh - t * (vh - quoteCenter)) + 'px';
      } else {
        s9ClosingQuote.style.opacity = '1';
        s9ClosingQuote.style.bottom = '';
        s9ClosingQuote.style.top = quoteCenter + 'px';
      }
    }

    window.addEventListener('scroll', function() {
      requestAnimationFrame(updateSection9Mobile);
    }, { passive: true });
    updateSection9Mobile();

  } else if (s9Container) {
    // === DESKTOP S9 (original) ===
    function updateSection9() {
      const rect = s9Container.getBoundingClientRect();
      const vh = window.innerHeight;
      const scrollableHeight = rect.height - vh;
      const progress = Math.min(1, Math.max(0, -rect.top / scrollableHeight));

      // --- Phase mapping (9 frames over 900vh scroll) ---
      // 0.00–0.08  Frame 1: Intro header visible, dashboard image peeking at bottom 50%
      // 0.08–0.16  Frame 2: Header fades to 50%, features slide in, dashboard text at 50%
      // 0.16–0.26  Frame 3: Dashboard hold — full opacity
      // 0.26–0.34  Frame 4: Dashboard→Event transition (simultaneous fade/slide)
      // 0.34–0.50  Frame 5: Event hold — full opacity
      // 0.50–0.58  Frame 6: Event→Reports transition (simultaneous fade/slide)
      // 0.58–0.76  Frame 7: Reports hold — full opacity
      // 0.76–0.88  Frame 8: Exit — everything scrolls up, closing quote fades in
      // 0.88–1.00  Frame 9: Closing quote centered, full opacity

      // === HEADER ===
      if (progress < 0.04) {
        // Fully visible
        s9Header.style.opacity = '1';
        s9Header.style.transform = 'translateY(calc(-50% - 80px))';
      } else if (progress < 0.12) {
        // Fade to 50% and slide up
        const t = (progress - 0.04) / 0.08;
        s9Header.style.opacity = String(1 - t * 0.5);
        s9Header.style.transform = `translateY(calc(-50% - 80px - ${t * 200}px))`;
      } else if (progress < 0.16) {
        // Fade out completely
        const t = (progress - 0.12) / 0.04;
        s9Header.style.opacity = String(0.5 - t * 0.5);
        s9Header.style.transform = `translateY(calc(-50% - 280px - ${t * 100}px))`;
      } else {
        s9Header.style.opacity = '0';
      }

      // === FEATURES CONTAINER (slides up at exit) ===
      if (progress < 0.76) {
        s9Features.style.transform = 'translateY(0)';
        s9Features.style.opacity = '1';
      } else if (progress < 0.88) {
        const t = (progress - 0.76) / 0.12;
        s9Features.style.transform = `translateY(${-t * 500}px)`;
        s9Features.style.opacity = String(1 - t);
      } else {
        s9Features.style.opacity = '0';
      }

      // === SUBTITLE ("Each one is designed...") ===
      if (progress < 0.08) {
        s9Subtitle.style.opacity = '0';
      } else if (progress < 0.14) {
        const t = (progress - 0.08) / 0.06;
        s9Subtitle.style.opacity = String(t);
      } else if (progress < 0.76) {
        s9Subtitle.style.opacity = '1';
      } else {
        s9Subtitle.style.opacity = '0';
      }

      // === DASHBOARD IMAGE ===
      if (progress < 0.06) {
        s9ImgDash.style.opacity = '0';
        s9ImgDash.style.top = '526px';
      } else if (progress < 0.14) {
        const t = (progress - 0.06) / 0.08;
        s9ImgDash.style.opacity = String(t);
        s9ImgDash.style.top = (526 - t * 526) + 'px';
      } else if (progress < 0.26) {
        s9ImgDash.style.opacity = '1';
        s9ImgDash.style.top = '0px';
      } else if (progress < 0.34) {
        // Fade out while event slides in simultaneously
        const t = (progress - 0.26) / 0.08;
        s9ImgDash.style.opacity = String(1 - t);
        s9ImgDash.style.top = '0px';
      } else {
        s9ImgDash.style.opacity = '0';
      }

      // === DASHBOARD TEXT ===
      // Fade in 0.08–0.16, hold 0.16–0.24, fade out 0.24–0.30
      if (progress < 0.08) {
        s9FeatDash.style.opacity = '0';
      } else if (progress < 0.12) {
        const t = (progress - 0.08) / 0.04;
        s9FeatDash.style.opacity = String(t * 0.5);
      } else if (progress < 0.16) {
        s9FeatDash.style.opacity = '0.5';
      } else if (progress < 0.20) {
        const t = (progress - 0.16) / 0.04;
        s9FeatDash.style.opacity = String(0.5 + t * 0.5);
      } else if (progress < 0.24) {
        s9FeatDash.style.opacity = '1';
      } else if (progress < 0.30) {
        const t = (progress - 0.24) / 0.06;
        s9FeatDash.style.opacity = String(1 - t);
      } else {
        s9FeatDash.style.opacity = '0';
      }

      // === EVENT IMAGE ===
      // Slides in simultaneously while dashboard fades out (starting at 0.26)
      if (progress < 0.26) {
        s9ImgEvent.style.opacity = '0';
        s9ImgEvent.style.top = '526px';
      } else if (progress < 0.34) {
        // Slide up from below while dashboard fades
        const t = (progress - 0.26) / 0.08;
        s9ImgEvent.style.opacity = String(t);
        s9ImgEvent.style.top = (526 - t * 526) + 'px';
      } else if (progress < 0.50) {
        // Full hold
        s9ImgEvent.style.opacity = '1';
        s9ImgEvent.style.top = '0px';
      } else if (progress < 0.58) {
        // Fade out while reports slides in simultaneously
        const t = (progress - 0.50) / 0.08;
        s9ImgEvent.style.opacity = String(1 - t);
        s9ImgEvent.style.top = '0px';
      } else {
        s9ImgEvent.style.opacity = '0';
      }

      // === EVENT TEXT ===
      // Fade in 0.26–0.34, hold 0.34–0.48, fade out 0.48–0.54
      if (progress < 0.26) {
        s9FeatEvent.style.opacity = '0';
      } else if (progress < 0.30) {
        const t = (progress - 0.26) / 0.04;
        s9FeatEvent.style.opacity = String(t * 0.5);
      } else if (progress < 0.34) {
        s9FeatEvent.style.opacity = '0.5';
      } else if (progress < 0.38) {
        const t = (progress - 0.34) / 0.04;
        s9FeatEvent.style.opacity = String(0.5 + t * 0.5);
      } else if (progress < 0.48) {
        s9FeatEvent.style.opacity = '1';
      } else if (progress < 0.54) {
        const t = (progress - 0.48) / 0.06;
        s9FeatEvent.style.opacity = String(1 - t);
      } else {
        s9FeatEvent.style.opacity = '0';
      }

      // === REPORTS IMAGE ===
      // Slides in simultaneously while event fades out (starting at 0.50)
      if (progress < 0.50) {
        s9ImgReports.style.opacity = '0';
        s9ImgReports.style.top = '526px';
      } else if (progress < 0.58) {
        // Slide up from below while event fades
        const t = (progress - 0.50) / 0.08;
        s9ImgReports.style.opacity = String(t);
        s9ImgReports.style.top = (526 - t * 526) + 'px';
      } else if (progress < 0.76) {
        // Full hold
        s9ImgReports.style.opacity = '1';
        s9ImgReports.style.top = '0px';
      } else {
        // Slides up with container
        s9ImgReports.style.opacity = '1';
        s9ImgReports.style.top = '0px';
      }

      // === REPORTS TEXT ===
      // Fade in 0.50–0.58, hold 0.58–0.76
      if (progress < 0.50) {
        s9FeatReports.style.opacity = '0';
      } else if (progress < 0.54) {
        const t = (progress - 0.50) / 0.04;
        s9FeatReports.style.opacity = String(t * 0.5);
      } else if (progress < 0.58) {
        s9FeatReports.style.opacity = '0.5';
      } else if (progress < 0.62) {
        const t = (progress - 0.58) / 0.04;
        s9FeatReports.style.opacity = String(0.5 + t * 0.5);
      } else if (progress < 0.76) {
        s9FeatReports.style.opacity = '1';
      } else {
        // Fades with container
        s9FeatReports.style.opacity = '1';
      }

      // === CLOSING QUOTE ===
      const quoteCenter = vh / 2 - 58;
      if (progress < 0.78) {
        s9ClosingQuote.style.opacity = '0';
        s9ClosingQuote.style.top = '';
        s9ClosingQuote.style.bottom = '0';
      } else if (progress < 0.84) {
        // Fade in quickly and slide to center
        const t = (progress - 0.78) / 0.06;
        s9ClosingQuote.style.opacity = String(t);
        s9ClosingQuote.style.bottom = '';
        s9ClosingQuote.style.top = (694 - t * (694 - quoteCenter)) + 'px';
      } else if (progress < 0.92) {
        // Hold centered at full opacity
        s9ClosingQuote.style.opacity = '1';
        s9ClosingQuote.style.bottom = '';
        s9ClosingQuote.style.top = quoteCenter + 'px';
      } else {
        // Gently scroll up as next section parallaxes in
        const t = (progress - 0.92) / 0.08;
        s9ClosingQuote.style.opacity = String(1 - t * 0.5);
        s9ClosingQuote.style.bottom = '';
        s9ClosingQuote.style.top = (quoteCenter - t * 150) + 'px';
      }
    }

    window.addEventListener('scroll', () => {
      requestAnimationFrame(updateSection9);
    }, { passive: true });
    updateSection9();
  }

  // --- Section 10: Mobile layout rearrangement ---
  if (isMobile) {
    // Move report image between heading and body inside .s10-text
    var s10Text = document.querySelector('.s10-text');
    var s10ReportImg = document.querySelector('.s10-report-image');
    var s10Body = document.querySelector('.s10-body');
    if (s10Text && s10ReportImg && s10Body) {
      s10Text.insertBefore(s10ReportImg, s10Body);
    }

    // --- S10 Charts: scroll-driven transition (phone + tablet) ---
    var s10Charts = document.querySelector('.s10-charts');
    var s10BottomArea = document.querySelector('.s10-bottom-area');
    var s10Inner = document.querySelector('.s10-inner');

    if (s10Charts && s10BottomArea && s10Inner) {
      // Create scroll wrapper and sticky viewport
      var s10ScrollWrapper = document.createElement('div');
      s10ScrollWrapper.className = 's10-scroll-wrapper';
      var s10StickyViewport = document.createElement('div');
      s10StickyViewport.className = 's10-sticky-viewport';

      // Insert wrapper before charts in the DOM
      s10Inner.insertBefore(s10ScrollWrapper, s10Charts);

      // Move charts and bottom-area into sticky viewport, then into wrapper
      s10StickyViewport.appendChild(s10Charts);
      s10StickyViewport.appendChild(s10BottomArea);
      s10ScrollWrapper.appendChild(s10StickyViewport);

      // Remove entrance animation classes — scroll animation controls visibility
      s10Charts.classList.remove('s10-entrance');
      s10BottomArea.classList.remove('s10-entrance');

      // Reports page: remove s10-entrance (conflicts with scroll wrapper override),
      // use custom fade-in-from-below observer instead
      var s10ReportsPageEl = s10BottomArea.querySelector('.s10-reports-page');
      if (s10ReportsPageEl) {
        s10ReportsPageEl.classList.remove('s10-entrance');
        var reportsObserver = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('s10-visible');
            }
          });
        }, { threshold: 0.4 });
        reportsObserver.observe(s10ReportsPageEl);
      }

      // Get chart elements
      var s10Chart1 = s10Charts.querySelector('.s10-chart:nth-child(1)');
      var s10Chart2 = s10Charts.querySelector('.s10-chart:nth-child(2)');
      var s10Chart3 = s10Charts.querySelector('.s10-chart:nth-child(3)');

      // Set initial states: chart 1 visible, charts 2+3 off-screen right
      // z-index stacking: chart 3 on top of 2 on top of 1 (later charts cover earlier)
      s10Chart1.style.zIndex = '1';
      s10Chart1.style.opacity = '1';
      s10Chart1.style.transform = 'translateX(0)';
      if (s10Chart2) {
        s10Chart2.style.zIndex = '2';
        s10Chart2.style.opacity = '1';
        s10Chart2.style.transform = 'translateX(100%)';
      }
      if (s10Chart3) {
        s10Chart3.style.zIndex = '3';
        s10Chart3.style.opacity = '1';
        s10Chart3.style.transform = 'translateX(100%)';
      }
      // Bottom area starts off-screen at bottom of viewport
      var vh = window.innerHeight;
      s10BottomArea.style.top = vh + 'px';
      s10BottomArea.style.opacity = '0';
      s10BottomArea.style.zIndex = '4';

      // Animation phases — charts overlap/cover horizontally from right:
      // Phase 1 (0–0.20): Chart 1 visible (hold)
      // Phase 2 (0.20–0.40): Chart 2 slides in from right, covering chart 1
      // Phase 3 (0.40–0.55): Chart 2 visible (hold)
      // Phase 4 (0.55–0.75): Chart 3 slides in from right, covering chart 2
      // Phase 5 (0.75–0.85): Chart 3 visible, video+quote enters from bottom
      // Phase 6 (0.85–1.0): Video+quote slides up to final position

      function updateS10ChartTransition() {
        var wrapperRect = s10ScrollWrapper.getBoundingClientRect();
        var scrollHeight = s10ScrollWrapper.offsetHeight - window.innerHeight;
        var scrolled = -wrapperRect.top;
        var progress = Math.max(0, Math.min(1, scrolled / scrollHeight));
        var viewH = window.innerHeight;

        // Once charts are gone, allow overflow so quote/author aren't clipped
        if (progress > 0.85) {
          s10StickyViewport.style.overflow = 'visible';
        } else {
          s10StickyViewport.style.overflow = 'hidden';
        }

        if (progress <= 0.20) {
          // Phase 1: Chart 1 visible, chart 2+3 off-screen right
          s10Chart1.style.opacity = '1';
          s10Chart1.style.transform = 'translateX(0)';
          if (s10Chart2) { s10Chart2.style.opacity = '1'; s10Chart2.style.transform = 'translateX(100%)'; }
          if (s10Chart3) { s10Chart3.style.opacity = '1'; s10Chart3.style.transform = 'translateX(100%)'; }
          s10BottomArea.style.top = viewH + 'px';
          s10BottomArea.style.opacity = '0';

        } else if (progress <= 0.40) {
          // Phase 2: Chart 2 slides over chart 1; chart 1 fades out
          var p = (progress - 0.20) / 0.20; // 0→1
          s10Chart1.style.opacity = String(1 - p);
          s10Chart1.style.transform = 'translateX(0)';
          if (s10Chart2) {
            s10Chart2.style.opacity = '1';
            s10Chart2.style.transform = 'translateX(' + ((1 - p) * 100) + '%)';
          }
          if (s10Chart3) { s10Chart3.style.opacity = '1'; s10Chart3.style.transform = 'translateX(100%)'; }
          s10BottomArea.style.top = viewH + 'px';
          s10BottomArea.style.opacity = '0';

        } else if (progress <= 0.55) {
          // Phase 3: Chart 2 fully covering chart 1 (hold)
          s10Chart1.style.opacity = '0';
          if (s10Chart2) { s10Chart2.style.opacity = '1'; s10Chart2.style.transform = 'translateX(0)'; }
          if (s10Chart3) { s10Chart3.style.opacity = '1'; s10Chart3.style.transform = 'translateX(100%)'; }
          s10BottomArea.style.top = viewH + 'px';
          s10BottomArea.style.opacity = '0';

        } else if (progress <= 0.75) {
          // Phase 4: Chart 3 slides over chart 2; chart 2 fades out
          var p = (progress - 0.55) / 0.20; // 0→1
          s10Chart1.style.opacity = '0';
          if (s10Chart2) {
            s10Chart2.style.opacity = String(1 - p);
            s10Chart2.style.transform = 'translateX(0)';
          }
          if (s10Chart3) {
            s10Chart3.style.opacity = '1';
            s10Chart3.style.transform = 'translateX(' + ((1 - p) * 100) + '%)';
          }
          s10BottomArea.style.top = viewH + 'px';
          s10BottomArea.style.opacity = '0';

        } else if (progress <= 0.85) {
          // Phase 5: Chart 3 fades out completely, video+quote enters from bottom
          var p = (progress - 0.75) / 0.10; // 0→1
          s10Chart1.style.opacity = '0';
          if (s10Chart2) { s10Chart2.style.opacity = '0'; }
          if (s10Chart3) {
            s10Chart3.style.opacity = String(Math.max(0, 1 - p * 2));
            s10Chart3.style.transform = 'translateX(0)';
          }
          var startTop = viewH;
          var targetTop = viewH * (469 / 568);
          s10BottomArea.style.top = (startTop + (targetTop - startTop) * p) + 'px';
          s10BottomArea.style.opacity = String(p);

        } else {
          // Phase 6: Video+quote slides up to final position; all charts already gone
          var p6 = (progress - 0.85) / 0.15; // 0→1
          s10Chart1.style.opacity = '0';
          if (s10Chart2) { s10Chart2.style.opacity = '0'; }
          if (s10Chart3) {
            s10Chart3.style.opacity = '0';
            s10Chart3.style.transform = 'translateX(0)';
          }
          var fromTop = viewH * (469 / 568);
          var toTop = 16; // near top of viewport so all content fits
          s10BottomArea.style.top = (fromTop + (toTop - fromTop) * p6) + 'px';
          s10BottomArea.style.opacity = '1';
        }
      }

      window.addEventListener('scroll', function() {
        requestAnimationFrame(updateS10ChartTransition);
      }, { passive: true });
      updateS10ChartTransition();
    }
  }

  // --- Section 10: Reports — entrance animations + line draw ---
  const s10Entrances = document.querySelectorAll('.s10-entrance');
  if (s10Entrances.length) {
    const s10Observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        } else {
          entry.target.classList.remove('visible');
        }
      });
    }, { threshold: 0.15 });

    s10Entrances.forEach(function(el) {
      // On mobile, skip entrance observer for elements inside scroll wrapper
      // (scroll animation or CSS override handles their visibility)
      if (isMobile && el.closest('.s10-scroll-wrapper')) {
        return;
      }
      s10Observer.observe(el);
    });
  }

  // Section 10: Line illustration draw animation
  const s10LineIllustration = document.querySelector('.s10-line-illustration');
  if (s10LineIllustration) {
    // Calculate and set the main line path length for stroke-dasharray animation
    const s10MainLine = s10LineIllustration.querySelector('.s10-main-line');
    if (s10MainLine) {
      const lineLen = s10MainLine.getTotalLength();
      s10LineIllustration.style.setProperty('--line-len', lineLen);
    }

    const s10LineObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          s10LineIllustration.classList.add('animate');
        } else {
          s10LineIllustration.classList.remove('animate');
        }
      });
    }, { threshold: 0.3 });
    s10LineObserver.observe(s10LineIllustration);
  }

  // --- Section 11: Results — entrance animations ---
  const s11Entrances = document.querySelectorAll('.s11-entrance');
  if (s11Entrances.length) {
    const s11Observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        } else {
          entry.target.classList.remove('visible');
        }
      });
    }, { threshold: 0.15 });
    s11Entrances.forEach((el) => s11Observer.observe(el));
  }

  // Cards slide in from right, staggered
  const s11Cards = document.querySelectorAll('.s11-card-entrance');
  if (s11Cards.length) {
    const s11CardObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = Array.from(s11Cards).indexOf(entry.target);
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, idx * 300);
        } else {
          entry.target.classList.remove('visible');
        }
      });
    }, { threshold: 0.15 });
    s11Cards.forEach((el) => s11CardObserver.observe(el));
  }
  // ============================================
  // Section 12: Credits — Scroll-driven animation
  // Phase 1 (0–0.14): Team visible, closing hidden
  // Phase 2 (0.14–0.28): Team fades out, closing text fades in
  // Phase 3 (0.28–0.38): CTA fades in
  // Phase 4 (0.38–1.0): Hold — closing text + CTA fully visible
  // ============================================
  const s12ScrollContainer = document.querySelector('.s12-scroll-container');
  const s12Credits = document.querySelector('.s12-credits');
  const s12Team = document.querySelector('.s12-team');
  const s12Closing = document.querySelector('.s12-closing');
  const s12Cta = document.querySelector('.s12-cta');

  var s12ClosingText = document.querySelector('.s12-closing-text');

  if (s12ScrollContainer && s12Team && s12Closing && s12Cta) {
    // Mobile: fade in credits + team when section enters viewport
    if (window.innerWidth <= 1024) {
      var s12Section = document.querySelector('.section-12');
      if (s12Section && s12Credits) {
        s12Credits.style.opacity = '0';
        s12Credits.style.transform = 'translateY(30px)';
        s12Credits.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        s12Team.style.opacity = '0';
        s12Team.style.transform = 'translateY(30px)';
        s12Team.style.transition = 'opacity 0.6s ease-out 0.15s, transform 0.6s ease-out 0.15s';

        var s12EnterObserver = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              s12Credits.style.opacity = '1';
              s12Credits.style.transform = 'translateY(0)';
              s12Team.style.opacity = '1';
              s12Team.style.transform = 'translateY(0)';
              s12EnterObserver.disconnect();
            }
          });
        }, { threshold: 0.05 });
        s12EnterObserver.observe(s12Section);
      }
    }

    function updateSection12() {
      var isMobile = window.innerWidth <= 1024;
      const rect = s12ScrollContainer.getBoundingClientRect();
      const scrollHeight = s12ScrollContainer.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / scrollHeight));

      var teamMaxOpacity = 1;
      var closingMaxOpacity = 1;

      if (!isMobile && progress <= 0.04) {
        // Phase 0: Credits + team fade in (desktop only)
        const fadeIn = progress / 0.04;
        if (s12Credits) {
          s12Credits.style.opacity = fadeIn;
          s12Credits.style.transform = `translateY(${40 * (1 - fadeIn)}px)`;
        }
        s12Team.style.opacity = fadeIn * teamMaxOpacity;
        s12Team.style.transform = `translateY(${40 * (1 - fadeIn)}px)`;
        s12Closing.style.opacity = 0;
        s12Closing.style.transform = 'translateY(120px)';
        s12Cta.style.opacity = 0;
      } else if (progress <= (isMobile ? 0.50 : 0.28)) {
        // Phase 1: Credits + team fully visible, closing hidden
        if (s12Credits) {
          s12Credits.style.opacity = 1;
          s12Credits.style.transform = 'translateY(0)';
        }
        s12Team.style.opacity = teamMaxOpacity;
        s12Team.style.transform = 'translateY(0)';
        s12Closing.style.opacity = 0;
        s12Closing.style.transform = 'translateY(120px)';
        s12Cta.style.opacity = 0;
      } else if (progress <= (isMobile ? 0.78 : 0.42)) {
        // Phase 2: Team fades out, closing slides up + fades in — credits stay
        var p2Start = isMobile ? 0.50 : 0.28;
        var p2End = isMobile ? 0.78 : 0.42;
        const phase2 = (progress - p2Start) / (p2End - p2Start);
        if (s12Credits) {
          s12Credits.style.opacity = 1;
          s12Credits.style.transform = 'translateY(0)';
        }
        s12Team.style.opacity = teamMaxOpacity * (1 - phase2);
        s12Team.style.transform = 'translateY(0)';
        s12Closing.style.opacity = phase2 * closingMaxOpacity;
        s12Closing.style.transform = `translateY(${120 * (1 - phase2)}px)`;
        s12Cta.style.opacity = 0;
      } else if (progress <= (isMobile ? 0.88 : 0.52)) {
        // Phase 3: CTA fades in — credits stay
        var p3Start = isMobile ? 0.78 : 0.42;
        var p3End = isMobile ? 0.88 : 0.52;
        const phase3 = (progress - p3Start) / (p3End - p3Start);
        if (s12Credits) s12Credits.style.opacity = 1;
        s12Team.style.opacity = 0;
        s12Closing.style.opacity = closingMaxOpacity;
        s12Closing.style.transform = 'translateY(0)';
        s12Cta.style.opacity = Math.min(1, phase3);
      } else {
        // Phase 4: Hold — credits + closing text + CTA fully visible
        if (s12Credits) s12Credits.style.opacity = 1;
        s12Team.style.opacity = 0;
        s12Closing.style.opacity = closingMaxOpacity;
        s12Closing.style.transform = 'translateY(0)';
        s12Cta.style.opacity = 1;
      }
    }

    window.addEventListener('scroll', updateSection12, { passive: true });
    updateSection12();
  }

  // --- Section 2: slow-scroll parallax on mobile ---
  if (window.innerWidth <= 1024) {
    var s2Section = document.querySelector('.section-2');
    var s2Composition = document.querySelector('.section-2-composition');
    if (s2Section && s2Composition) {
      var parallaxFactor = 0.35; // composition moves at 35% of scroll speed
      function updateS2Parallax() {
        var rect = s2Section.getBoundingClientRect();
        // Only apply when section is scrolling past the viewport
        if (rect.top < 0 && rect.bottom > 0) {
          var scrolled = -rect.top;
          s2Composition.style.transform = 'translateY(' + (scrolled * parallaxFactor) + 'px)';
        } else if (rect.top >= 0) {
          s2Composition.style.transform = 'translateY(0)';
        }
      }
      window.addEventListener('scroll', updateS2Parallax, { passive: true });
      updateS2Parallax();
    }
  }

  // --- Footer: hide fixed header when footer is on screen ---
  if (window.innerWidth <= 1024) {
    var siteHeader = document.querySelector('.header');
    var siteFooter = document.querySelector('.site-footer');

    if (siteHeader && siteFooter) {
      var footerObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            siteHeader.style.opacity = '0';
            siteHeader.style.pointerEvents = 'none';
            siteHeader.style.transition = 'opacity 0.3s ease';
          } else {
            siteHeader.style.opacity = '1';
            siteHeader.style.pointerEvents = '';
            siteHeader.style.transition = 'opacity 0.3s ease';
          }
        });
      }, { threshold: 0 });
      footerObserver.observe(siteFooter);
    }
  }

})();
