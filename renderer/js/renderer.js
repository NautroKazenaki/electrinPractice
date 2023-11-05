const form = document.querySelector("#img-form");
const img = document.querySelector("#img");
const outputPath = document.querySelector("#output-path");
const filename = document.querySelector("#filename");
const heightInput = document.querySelector("#height");
const widthInput = document.querySelector("#width");

const loadImage = (e) => {
  const file = e.target.files[0];

  if (!isFileImage(file)) {
    alertError("Please select an image");
    return;
  }

  //получение разрешения изображения
  const image = new Image();
  image.src = URL.createObjectURL(file);
  image.onload = function () {
    widthInput.value = this.width;
    heightInput.value = this.height;
  };

  form.style.display = "block";
  filename.innerText = file.name;
  outputPath.innerText = path.join(os.homedir(), "resultOfImageResizerApp");
};

const sendImage = (e) => {
  e.preventDefault();

  const width = widthInput.value;
  const height = heightInput.value;
  const imgPath = img.files[0].path

  if (!img.files[0]) {
    alertError("Please upload an image");
    return;
  }

  if (width === "" || height === "") {
    alertError("Please don't forget to enter height and width");
    return;
  }

  //отправить в мейн процесс через ipcRenderer
  ipcRenderer.send('image: resize', {
      imgPath,
      width,
      height
  })
};

//получение алерта об успехе от ipcMain
ipcRenderer.on('image:done', () => {
    alertSuccess(`Image resized to ${widthInput.value} x ${heightInput.value}`)
})

//проверка на изображение
const isFileImage = (file) => {
  const acceptedImageTypes = ["image/gif", "image/png", "image/jpeg"];
  return file && acceptedImageTypes.includes(file["type"]);
};

const alertError = (message) => {
  Toastify.toast({
    text: message,
    duration: 5000,
    close: false,
    style: {
      background: "red",
      color: "white",
      textAlign: "center",
    },
  });
};

const alertSuccess = (message) => {
  Toastify.toast({
    text: message,
    duration: 5000,
    close: false,
    style: {
      background: "green",
      color: "white",
      textAlign: "center",
    },
  });
};

img.addEventListener("change", loadImage);
form.addEventListener("submit", sendImage);
