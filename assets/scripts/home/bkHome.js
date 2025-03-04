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
  const hideRightPos = 100;
  const showRightPos = 0;

  // start the page elements
  // Part loader for homepage
  this.loadPageElements = function() {

    $(() => { $("#about").load("./pages/parts/about3.html"); });
    $(() => { $("#resume").load("./pages/parts/resume3.html"); });
    $(() => { $("#projects").load("./pages/parts/projects3.html"); });
    $(() => { $("#downloads").load("./pages/parts/downloads3.html"); });
    $(() => { $("#footer").load("./pages/parts/footer.html"); });

    gsap.to("#footer", { 
      opacity: 0,
      duration: 0,
      onComplete: () => {
        gsap.to("#footer", { 
          opacity: 0.5,
          duration: 3 
        });
      }
    });

  }

  this.showPanel = function(panel) {
    if (activePanel != null) this.hideActivePanel(panel);
    else this.animatePanel(panel);
  }
  
  this.hideActivePanel = function(targetPanel) {
    if (activePanel === null) return;

    const divName = activePanel.replace("#","");
    const tempDiv = document.getElementById(divName);
    
    gsap.to(activePanel, {
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
    
    const divName = targetPanel.replace("#","");
    const tempDiv = document.getElementById(divName);

    gsap.to( targetPanel, {
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


// disable the context menu for the canvas object
const timer = setInterval( ()=> {
    const canvas = document.getElementById('canvasarea')
    if (canvas) {
      canvas.addEventListener('contextmenu',
        (event) => { event.preventDefault(); }
      );
      clearInterval(timer);
    }
  }, 100
);
