const links = {
  fb: "https://www.facebook.com/BlackOnslaught",
  insta: "https://www.instagram.com/knvs.jsff/",
  linkedin: "https://www.linkedin.com/in/kj-cabrera/",
  bitknvs: "https://bitknvs-30e00398cef5.herokuapp.com/",
  itch: "https://bitknvs.itch.io/"
}
function openLink(link) {
  window.open(link, "_blank");
}

// homepage class
function homepageObj() {
  
  let activePanel = null;
  const transitionDuration = 0.75;
  const hideRightPos = 0;
  const showRightPos = -101;

  this.showPanel = function(panel) {
    if (activePanel != null) this.hideActivePanel(panel);
    else this.animatePanel(panel);
  }
  
  this.hideActivePanel = function(targetPanel) {
    if (activePanel === null) return;
    gsap.to(activePanel, { 
      xPercent: hideRightPos,
      yPercent: 0,
      opacity: 0,
      duration: transitionDuration,
      ease: "power1.in",
      onComplete: () => {
        gsap.to(activePanel, { display: "none", duration: 0 });
        if (targetPanel !== "home") this.animatePanel(targetPanel);
        else activePanel = null;
      }
    });
  }

  this.animatePanel = function(targetPanel) {
    gsap.to( targetPanel, {
      xPercent: showRightPos,
      yPercent: 0,
      opacity: 0.9,
      duration: transitionDuration,
      ease: "power1.out",
      onStart: () => {
        gsap.to(targetPanel, { display: "block", duration: 0 });
      },
      onComplete: () => {
        activePanel = targetPanel;
      }
    });
  }
}
bkObj = new homepageObj();