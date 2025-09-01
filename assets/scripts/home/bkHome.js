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
  const transitionDuration = 0.5;

  // start the page elements
  // Part loader for homepage
  this.loadPageElements = function() {
    
    $(() => { $("#about").load("./pages/parts/about3.html"); });
    $(() => { $("#resume").load("./pages/parts/resume3.html"); });
    $(() => { $("#projects").load("./pages/parts/projects3.html"); });
    $(() => { $("#downloads").load("./pages/parts/downloads3.html"); });
    $(() => { $("#footer").load("./pages/parts/footer.html"); });
  
    // set the innerText of the homeInstructions to depend on the orientation of the browser
    const vpWidth = window.innerWidth;
    const orientation = window.screen.orientation.type;
    const instruction = (orientation.includes("landscape") && vpWidth > 500) ? "Use ↑ or ↓ keys or click on an option to select</br> Press Enter or click the selected option to open" : "Use ← or → keys or click on an option to select</br> Press Enter or click the selected option to open";
    $("#homeInstructions").html(instruction);

    gsap.to("#footer", { 
      opacity: 0,
      duration: 0,
      onComplete: () => {
        $("#homeMenu").css("display","block")
        gsap.to("#footer", { 
          opacity: 0.5,
          duration: 3 
        });
        gsap.to(".home-card", { 
          opacity: 1,
          duration: 3,
          onComplete: () => {
            $("#homeInstructions").css("animation","opacityWeave 10s ease-in-out infinite");
          }
        });
        
      }
    });

  }

  // For creating flashing divs on display or hide
  function createFlashDiv(targetDiv) {
    const newDiv = document.createElement("div");

    // temporarily display the targetDiv to accurately calculate its positioning
    const computedStyle = window.getComputedStyle(targetDiv);
    for (let property of computedStyle) {
      // only get specific properties of the targetDiv:
      if (
          property === "width"     || 
          property === "height"    || 
          property === "position"  ||
          property === "transform" ||
          property === "left"      ||
          property === "top"       ||
          property === "margin-top" 
        ) newDiv.style[property] = computedStyle.getPropertyValue(property);
    }
    
    newDiv.style.backgroundColor = "transparent";
    newDiv.id = "flashDiv";
    newDiv.classList.add("gridflash-container");
    document.body.appendChild(newDiv);
    return newDiv;
  }

  // For creating flashing divs with the flash div
  function createFlashGrid(flashDiv, gridCount = 50) {

    const computedStyle = window.getComputedStyle(flashDiv);
    
    let gridHeight = computedStyle.getPropertyValue("height");
    let gridWidth = computedStyle.getPropertyValue("width");
    gridHeight = gridHeight.replace("px","");
    gridHeight = Number(gridHeight);
    gridWidth = gridWidth.replace("px","");
    gridWidth = Number(gridWidth);
    
    const gridArea = gridWidth * gridHeight;
    const boxArea = gridArea / gridCount;
    const boxSide = Math.sqrt(boxArea);
    const boxRows = Math.ceil(gridHeight / boxSide);
    const boxColumns = Math.ceil(gridWidth / boxSide);
    gridCount = boxRows * boxColumns;
    const boxGrid = [];

    // adjust the grid-template-rows and columns setting of the flashdiv
    flashDiv.style.gridTemplateRows = `repeat(${boxRows}, ${boxSide}px`;
    flashDiv.style.gridTemplateColumns = `repeat(${boxColumns}, ${boxSide}px`;

    for (let i = 0; i < gridCount; i++) {
      const borderWidth = (Math.random() * 3) + 0.5;
      const shade1 = Math.max(118, Math.min((Math.random() * 255), 198)); // range fom 108 - 208 (originally 158)
      const shade2 = Math.max(91, Math.min((Math.random() * 255), 161)); // range from 81 - 181 (originally 131)
      const newBox = document.createElement("div");
      newBox.style.width = boxSide + "px";
      newBox.style.height = boxSide + "px";
      newBox.classList.add("gridflash-part");
      newBox.style.backgroundColor = "transparent";
      newBox.style.border = `${borderWidth}px solid rgb(${shade1}, 216, ${shade2})`; // original shade: 158, 216, 131
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
      gsap.to(tempDiv, {
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
    else {
      if (targetPanel !== "home") this.animatePanel(targetPanel);
      else activePanel = null;
    }
    
  }

  // animate the intro of a panel
  this.animatePanel = function(targetPanel) {
    const divName = targetPanel.replace("#","");
    const tempDiv = document.getElementById(divName);

    if (tempDiv) {
      const flashDiv = createFlashDiv(tempDiv);
      flashDiv.classList.add("translate-middle");
      const tempGrid = createFlashGrid(flashDiv);

      // shuffle the current grid by swapping the items at indices i and j using destructuring []
      for (let i = tempGrid.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tempGrid[i], tempGrid[j]] = [tempGrid[j], tempGrid[i]];
      }

      // assign separate gsap actions per box and chain them
      let startGsap = null, prevGsap = null;
      for (let i = 0; i < tempGrid.length; i++) {
        const box = tempGrid[i];
        box.style.opacity = 0;
        const currentGsap = gsap.to(box, {
          opacity: 1,
          duration: 0.01,
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
        ease: "power1.out",
        paused: true,
        onStart: () => {
          gsap.to(targetPanel, { display: "block", opacity: 1, duration: 0 });
        },
        onComplete: () => {
          activePanel = targetPanel;
          document.body.removeChild(flashDiv);
        }
      });
      prevGsap.vars.onComplete = () => {
        flashDiv.style.backgroundColor = "white";
        flashDiv.style.opacity = 1;
        flashGsap.play();
      }

      // start the intro animation
      startGsap.play();
    }
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
