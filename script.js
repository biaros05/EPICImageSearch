"use strict";
!(function(){

  const TYPES = ["natural","enhanced", "aerosol","cloud"];
  const EpicApplication = {
    images : [],
    type : "",
    dateCache: {},
    imageCache: {}
  };

  document.addEventListener("DOMContentLoaded", function(e) {

    let currentlySelectedDate = ""; // represents the date selected when the user submits (does NOT dynamically change in between submissions)

    setOptions();
    setCache();
    EpicApplication.type = document.getElementById("type").value;
    fetchAndSetMaxDate(EpicApplication.type);

    document.getElementById("request_form").addEventListener("submit", function(e){
      e.preventDefault();
      EpicApplication.type = document.getElementById("type").value; // log SELECTED type (does NOT dynamically change between submissions)
      currentlySelectedDate = document.getElementById("date").value;
      if (EpicApplication.imageCache[EpicApplication.type].get(currentlySelectedDate) === undefined) 
      {
        fetchData();
      }
      else 
      {
        generateImageLI(EpicApplication.imageCache[EpicApplication.type].get(currentlySelectedDate));
      }
    });

    document.getElementById("image-menu").addEventListener("click", function(e){ 
      let index = e.target.parentElement.getAttribute("data-image-list-index");
      imageSetup(EpicApplication.imageCache[EpicApplication.type].get(currentlySelectedDate)[index]);
    });

    // generating new maxDate for the image that they select, however do NOT relog that image until they resubmit.
    document.getElementById("type").addEventListener("change", function(e){
      let currentlySelectedType = e.target.value;
      if (EpicApplication.dateCache[currentlySelectedType] === null) 
      {
        fetchAndSetMaxDate(currentlySelectedType);
      }
      else
      {
        document.getElementById("date").max = EpicApplication.dateCache[currentlySelectedType];
      }
    });

  });

  /**
     * this function generates the LI for a particular array of images
     * @param {Array} images - represents the array of images
     */
  function generateImageLI(images)
  {
    Array.from(document.getElementById("image-menu").children)
    .forEach((li) => li.remove());

    images
    .forEach(
      (img) => generateRow(img.date, true)
    );
    if (images.length === 0)
    {
      generateRow("No image was found!", false);
    }
  }

  /**
   * this function generates the option DOM elements based on the types
   */
  function setOptions()
  {
    const select = document.getElementById("type");
    TYPES.forEach((el) => {
      let option = document.createElement("option");
      option.textContent = el;
      option.value = el;
      select.appendChild(option);
    })
  }

  /**
   * this function sets the keys of the dateCache variable based on the types given in the array
   */
  function setCache()
  {
    TYPES.forEach((el) => {
      EpicApplication.dateCache[el] = null;
      EpicApplication.imageCache[el] = new Map();
    });
  }

  /**
   * this function sets up the image
   * @param {DOMElement} imageSelected - represents the image the user has clicked
   */
  function imageSetup(imageSelected){
    let splitDate = imageSelected.date.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}/)[0];
    splitDate = splitDate.split("-");
    const imageFile = imageSelected.image;
    const url = `https://epic.gsfc.nasa.gov/archive/${EpicApplication['type']}/${splitDate[0]}/${splitDate[1]}/${splitDate[2]}/jpg/${imageFile}.jpg`;
    document.getElementById("earth-image").src = url;
    document.getElementById("earth-image-date").textContent = imageSelected.date;
    document.getElementById("earth-image-title").textContent = imageSelected.caption;
    document.getElementById("earth-image").style.visibility = "visible";
  }

  /**
   * this function fetches the latest date a picture was taken and sets the maximum date in
   * the date input to be of that date
   */
  function fetchAndSetMaxDate(currentlySelectedType){
    fetch(`https://epic.gsfc.nasa.gov/api/${currentlySelectedType}/all`, {})
        .then( response => { 
            // Stage 1: Take in a response and verify if it's OK      
            if( !response.ok ) { 
                throw new Error("Not 2xx response", {cause: response});
            }
            
            // If the response is OK, deserialize it.
            return response.json();
        })
        .then( obj => {
            // Stage 2: Take the de-serialized response and do something with it
            let maxDate = obj.map((el) => {
              return(new Date(el.date));
            })
            .toSorted((a, b) => {
              if (a < b) {return 1;}
              else if (a > b) {return -1;}
              else {return 0;}
            })[0];
            let splitDate = maxDate.toISOString().match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}/)[0]; // YYY-MM-DD
            EpicApplication.dateCache[currentlySelectedType] = splitDate;
            document.getElementById("date").max = EpicApplication.dateCache[currentlySelectedType];
        })
        .catch( err => {
            // Stage 3: Handle any errors
            console.error("3)Error:", err);
            Array.from(document.getElementById("image-menu").children)
            .forEach((li) => li.remove());
            generateRow("Error occured while fetching!", false);
        });
  }

  /**
   * this function fetches the data based on user values and generates a list of available images
   * in the ul element
   */
  function fetchData()
  {
    let selectedDate = document.getElementById("date").value;
    fetch(`https://epic.gsfc.nasa.gov/api/${EpicApplication.type}/date/${selectedDate}`, {})
        .then( response => { 
            // Stage 1: Take in a response and verify if it's OK
            if( !response.ok ) { 
                throw new Error("Not 2xx response", {cause: response});
            }
            
            // If the response is OK, deserialize it.
            return response.json();
        })
        .then( obj => {
            // Stage 2: Take the de-serialized response and do something with it
            EpicApplication.images = obj;
            generateImageLI(obj);
            EpicApplication.imageCache[EpicApplication.type].set(selectedDate, obj);
        })
        .catch( err => {
            // Stage 3: Handle any errors
            console.error("3)Error:", err);
            generateRow("Error occured while fetching!", false);
        });
  }

  /** 
   * this function creates a row using the li template and appends it to the ul
   * @param {String} text - represents the textContent of the li
   * @param {boolean} isImage - represents whether the data being sent is to generate an image or not.
   */
  function generateRow(text, isImage)
  {
    let ul = document.getElementById("image-menu");
    const template = document.getElementById("image-menu-item").content;
    let newLi = template.cloneNode(true);
    newLi.querySelector("li").setAttribute("data-image-list-index", ul.children.length);
    if (isImage)
    {
      newLi.querySelector("span").textContent = text;
    }
    else 
    {
      newLi.querySelector("span").remove;
      newLi.querySelector("li").textContent = text;
    }
    ul.appendChild(newLi);
  }

}());
