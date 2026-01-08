// Section switch
document.querySelectorAll(".hvop-nav-btn").forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll(".hvop-nav-btn,.hvop-panel")
      .forEach(el=>el.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.target).classList.add("active");
  };
});

// Add friend interaction
const addBtn = document.getElementById("hvop-add-friend-btn");
addBtn.onclick = ()=>{
  if(addBtn.classList.contains("added")) return;
  addBtn.textContent = "✔ Friends";
  addBtn.classList.add("added");
};
