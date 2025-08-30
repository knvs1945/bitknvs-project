let activeDiv = null
let mainDiv = null
let parentMainDiv = null
let projectDetails = null

function getTopDiv() {
  mainDiv = $("#projectsMain");
  parentMainDiv = $(mainDiv).parent();
  firstChild = mainDiv.children().first(); 
}

function getProjectDetails() {

  $.getJSON("/assets/scripts/projects/projects_details.json", 
    (data) => {
      if (data) projectDetails = data;
  })
  .then(() => {
    for (item in projectDetails) {
      let itemID = "#" + item;
      $(itemID).html(projectDetails[item].description);
    }
  })
  .fail((error) => {
    console.log("Error fetching json data: ", error);
  });
  
}

function expandProjectDiv(target) {

  let targetDiv = $("#"+ target)[0];
  let parentDiv = $(targetDiv).parent();
  let btExpand = $(targetDiv).siblings(".bt_expand_down");
  if (!activeDiv) activeDiv = targetDiv;
  if (targetDiv.classList.contains("project_tab_hidden")) {
      
    let offset = parentDiv.offset().top - 100;
    let scrollPos = mainDiv.scrollTop() + offset;
    let padding = 40;
    mainDiv.animate({
      scrollTop: scrollPos
    }, 500, () => {
      targetDiv.classList.remove("project_tab_hidden");
      mainDiv[0].classList.remove("overflow-y-auto");
      mainDiv[0].classList.add("overflow-y-hidden");
      parentDiv.css("height", (parentMainDiv.height() - padding) + "px")
      // parentDiv.animate({
      //   height: (parentMainDiv.height() - padding)
      // }, 500);
      btExpand.css("transform", "rotate(180deg)");
    });
  }
  else {
      targetDiv.classList.add("project_tab_hidden");
      parentDiv.css("height", "");
      mainDiv.css("overflow-y", "");
      btExpand.css("transform", "");
      mainDiv[0].classList.remove("overflow-y-hidden");
      mainDiv[0].classList.add("overflow-y-auto");
      activeDiv = null
  }
 
}

getTopDiv();
getProjectDetails();
