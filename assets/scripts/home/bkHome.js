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

  // For creating flashing divs on display or hide
  function createFlashDiv(targetDiv) {
    const newDiv = document.createElement("div");
    const computedStyle = window.getComputedStyle(targetDiv);
    for (let property of computedStyle) {
      // only get specific properties of the targetDiv:
      if (
          property === "width"     || 
          property === "height"    || 
          property === "position"  ||
          property === "transform" ||
          property === "left"      ||
          property === "top"
        ) newDiv.style[property] = computedStyle.getPropertyValue(property);
    }
    
    newDiv.style.backgroundColor = "transparent";
    newDiv.id = "flashDiv";
    newDiv.classList.add("gridflash-container");
    document.body.appendChild(newDiv);
    return newDiv;
  }

  // For creating flashing divs with the flash div
  function createFlashGrid(flashDiv, boxRows = 5) {

    const computedStyle = window.getComputedStyle(flashDiv);

    let boxHeight = computedStyle.getPropertyValue("height");
    boxHeight = boxHeight.replace("px","");
    boxHeight = Number(boxHeight);
    let boxWidth = computedStyle.getPropertyValue("width");
    boxWidth = boxWidth.replace("px","");
    boxWidth = Number(boxWidth);

    const boxSide = boxHeight / boxRows;
    const boxColumns = Math.floor(boxWidth / boxSide) + 1;
    const boxCount = boxRows * boxColumns; // number of boxes to create;
    const boxGrid = [];

    // adjust the grid-template-rows and columns setting of the flashdiv
    flashDiv.style.gridTemplateRows = `repeat(${boxRows}, ${boxSide}px`;
    flashDiv.style.gridTemplateColumns = `repeat(${boxColumns}, ${boxSide}px`;

    for (let i = 0; i < boxCount; i++) {
      const newBox = document.createElement("div");
      newBox.style.width = boxSide + "px";
      newBox.style.height = boxSide + "px";
      newBox.classList.add("gridflash-part");
      newBox.style.backgroundColor = "white";
      flashDiv.appendChild(newBox);
      boxGrid.push(newBox);
    }

    return boxGrid;
  }

  this.showPanel = function(panel) {
    if (activePanel != null) this.hideActivePanel(panel);
    else this.animatePanel(panel);
  }
  
  this.hideActivePanel = function(targetPanel) {
    if (activePanel === null) return;
    const divName = activePanel.replace("#","");
    const tempDiv = document.getElementById(divName);
    
    if (tempDiv) {
      const flashDiv = createFlashDiv(tempDiv);
      const tempGrid = createFlashGrid(flashDiv);

      // shuffle the current grid by swapping the items at indices i and j using destructuring []
      for (let i = tempGrid.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tempGrid[i], tempGrid[j]] = [tempGrid[j], tempGrid[i]];
      }

      let startGsap = null, prevGsap = null;
      for (let i = 0; i < tempGrid.length; i++) {
        const box = tempGrid[i];
        const currentGsap = gsap.to(box, {
          opacity: 0,
          duration: 0.05,
          paused: true
        })

        if (!startGsap) startGsap = currentGsap;
        if (prevGsap) {
          prevGsap.vars.onComplete = () => {
            currentGsap.play();
          }
        }
        prevGsap = currentGsap;
      }
      
      tempDiv.style.opacity = 0;
      const flashGsap = gsap.to(flashDiv, {
        opacity: 0,
        duration: transitionDuration,
        ease: "power1.in",
        paused: true,
        onComplete: () => {
          gsap.to(activePanel, { display: "none", duration: 0 });
          if (targetPanel !== "home") this.animatePanel(targetPanel);
          else activePanel = null;
          // document.body.removeChild(flashDiv);
        }
      });
      prevGsap.vars.onComplete = () => {
        // flashDiv.style.backgroundColor = "white";
        flashGsap.play();
      }

      // start the outro animation
      startGsap.play();
    }
    else {
      if (targetPanel !== "home") this.animatePanel(targetPanel);
      else activePanel = null;
    }
    
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
