let activeDiv = null
let mainDiv = null
let parentMainDiv = null

function getTopDiv() {

  mainDiv = $("#projectsMain");
  parentMainDiv = $(mainDiv).parent();
  firstChild = mainDiv.children().first(); 

}

function expandProjectDiv(target) {

  let targetDiv = $("#"+ target)[0];
  let parentDiv = $(targetDiv).parent();
  if (!activeDiv) activeDiv = targetDiv;
  if (targetDiv.classList.contains("project_tab_hidden")) {
      
    let offset = parentDiv.offset().top - 100;
    let scrollPos = mainDiv.scrollTop() + offset;
    let padding = 40;
    mainDiv.animate({
      scrollTop: scrollPos
    }, 500, () => {
      targetDiv.classList.remove("project_tab_hidden");
      parentDiv.animate({
        height: (parentMainDiv.height() - padding)
      }, 500);
    });
  }
  else {
      targetDiv.classList.add("project_tab_hidden");
      parentDiv.css("height", "");
      activeDiv = null
  }
 
  // console.log(activeDiv)
  // console.log(targetDiv)

}

getTopDiv()