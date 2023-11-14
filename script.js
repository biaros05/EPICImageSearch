"use strict";
!(function(){

  let images = [];
  let type = "";

  document.addEventListener("DOMContentLoaded", function(e) {
    fetchAndSetMaxDate();
    document.getElementById("request_form").addEventListener("submit", function(e){
      e.preventDefault();
      Array.from(document.getElementById("image-menu").children)
      .forEach((li) => li.remove());
      fetchData();
    });

    document.getElementById("image-menu").addEventListener("click", function(e){ 
      let index = e.target.parentElement.getAttribute("data-image-list-index");
      imageSetup(index);
    });

    document.getElementById("type").addEventListener("change", function(e){
      fetchAndSetMaxDate();
    })
    
  });

  /**
   * this function sets up the image
   * @param {Number} index - represents the index of the image the user has clicked
   */
  function imageSetup(index){
    let splitDate = images[index].date.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}/)[0];
    splitDate = splitDate.split("-");
    const imageFile = images[index].image;
    const url = `https://epic.gsfc.nasa.gov/archive/${type}/${splitDate[0]}/${splitDate[1]}/${splitDate[2]}/jpg/${imageFile}.jpg`;
    document.getElementById("earth-image").src = url;
    document.getElementById("earth-image-date").textContent = images[index].date;
    document.getElementById("earth-image-title").textContent = images[index].caption;
    document.getElementById("earth-image").style.visibility = "visible";
  }

  /**
   * this function fetches the latest date a picture was taken and sets the maximum date in
   * the date input to be of that date
   */
  function fetchAndSetMaxDate(){
    type = document.getElementById("type").value;
    fetch(`https://epic.gsfc.nasa.gov/api/${type}/all`, {})
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
            let date = obj.map((el) => {
              return(new Date(el.date));
            })
            .toSorted((a, b) => {
              if (a < b) {return 1;}
              else if (a > b) {return -1;}
              else {return 0;}
            })[0];
            let splitDate = date.toISOString().match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}/)[0]; // YYY-MM-DD
            document.getElementById("date").max = splitDate;
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
    type = document.getElementById("type").value;
    let date = document.getElementById("date").value;
    console.log(date)
    fetch(`https://epic.gsfc.nasa.gov/api/${type}/date/${date}`, {})
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
            obj.forEach((img) => generateRow(img.date, true));
            images = obj;
            if (images.length === 0)
            {
              generateRow("No image was found!", false);
            }
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