const DB_NAME = "BoutiqueGodwinDB";
const STORE_NAME = "products";

let db;
let selectedImages = [];
let existingImages = [];

// ELEMENTS
const form = document.getElementById("product-form");
const productId = document.getElementById("product-id");
const productName = document.getElementById("product-name");
const productCategory = document.getElementById("product-category");
const productPrice = document.getElementById("product-price");
const productDescription = document.getElementById("product-description");
const imageInput = document.getElementById("product-images");
const imagePreview = document.getElementById("image-preview");
const imageCount = document.getElementById("image-count");
const productsList = document.getElementById("products-list");
const productCount = document.getElementById("product-count");
const formTitle = document.getElementById("form-title");
const saveButton = document.getElementById("save-button");
const cancelButton = document.getElementById("cancel-edit");

// OPEN DATABASE
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onerror = () => reject(request.error);
  });
}

// DATABASE TRANSACTION
function getStore(mode = "readonly") {
  return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
}

// GET ALL PRODUCTS
function getAllProducts() {
  return new Promise((resolve, reject) => {
    const request = getStore().getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// SAVE PRODUCT
function saveProduct(product) {
  return new Promise((resolve, reject) => {
    const store = getStore("readwrite");
    const request = product.id ? store.put(product) : store.add(product);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// DELETE PRODUCT
function deleteProduct(id) {
  return new Promise((resolve, reject) => {
    const request = getStore("readwrite").delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// IMAGE PREVIEW
imageInput.addEventListener("change", () => {
  const files = Array.from(imageInput.files);

  selectedImages = files.filter((file) => file.type.startsWith("image/"));

  showImagePreview();
});

function showImagePreview() {
  imagePreview.innerHTML = "";

  const total = existingImages.length + selectedImages.length;

  imageCount.textContent = `${total} photo(s) au total. Minimum requis : 3.`;

  existingImages.forEach((image) => {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(image);
    imagePreview.appendChild(img);
  });

  selectedImages.forEach((image) => {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(image);
    imagePreview.appendChild(img);
  });
}

// RESET FORM
function resetForm() {
  form.reset();
  productId.value = "";
  selectedImages = [];
  existingImages = [];
  imagePreview.innerHTML = "";
  imageCount.textContent = "Aucune photo sélectionnée.";
  formTitle.textContent = "Ajouter un produit";
  saveButton.textContent = "Enregistrer le produit";
  cancelButton.hidden = true;
  imageInput.required = true;
}

// CREATE / UPDATE
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const id = productId.value ? Number(productId.value) : null;

  const oldProduct = id
    ? (await getAllProducts()).find((p) => p.id === id)
    : null;

  const images = [...existingImages, ...selectedImages];

  if (images.length < 3) {
    alert("Un produit doit avoir au minimum 3 photos.");
    return;
  }

  const product = {
    name: productName.value.trim(),
    category: productCategory.value,
    price: Number(productPrice.value),
    description: productDescription.value.trim(),
    images,
    createdAt: oldProduct?.createdAt || new Date().toISOString(),
  };

  if (id) product.id = id;

  if (
    !product.name ||
    !product.description ||
    !Number.isFinite(product.price) ||
    product.price < 0
  ) {
    alert("Vérifie les informations du produit.");
    return;
  }

  try {
    await saveProduct(product);
    alert("Produit enregistré avec succès !");
    resetForm();
    await renderProducts();
  } catch (error) {
    console.error(error);
    alert("Erreur pendant l'enregistrement du produit.");
  }
});

// DISPLAY PRODUCTS
async function renderProducts() {
  const products = await getAllProducts();

  productsList.innerHTML = "";
  productCount.textContent = `${products.length} produit(s)`;

  if (products.length === 0) {
    productsList.innerHTML = `
            <p class="empty-message">
                Aucun produit enregistré pour le moment.
            </p>
        `;
    return;
  }

  products.forEach((product) => {
    const card = document.createElement("div");
    card.style.cssText = `
            display:flex;
            gap:15px;
            align-items:center;
            padding:15px 0;
            border-bottom:1px solid #e4e7ec;
        `;

    const image = document.createElement("img");
    image.src = URL.createObjectURL(product.images[0]);
    image.alt = product.name;
    image.style.cssText = `
            width:90px;
            height:80px;
            object-fit:cover;
            border-radius:8px;
        `;

    const info = document.createElement("div");
    info.style.flex = "1";

    const name = document.createElement("h4");
    name.textContent = product.name;

    const category = document.createElement("p");
    category.textContent = product.category;
    category.style.color = "#667085";

    const price = document.createElement("strong");
    price.textContent = product.price.toLocaleString("fr-FR") + " FCFA";

    const editButton = document.createElement("button");
    editButton.textContent = "Modifier";
    editButton.type = "button";
    editButton.style.cssText =
      "padding:8px 12px;margin-top:8px;cursor:pointer;";
    editButton.addEventListener("click", () => editProduct(product.id));

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Supprimer";
    deleteButton.type = "button";
    deleteButton.style.cssText =
      "padding:8px 12px;margin:8px 0 0 6px;color:#d92d20;cursor:pointer;";
    deleteButton.addEventListener("click", () => removeProduct(product.id));

    info.append(
      name,
      category,
      price,
      document.createElement("br"),
      editButton,
      deleteButton,
    );

    card.append(image, info);
    productsList.appendChild(card);
  });
}

// EDIT PRODUCT
async function editProduct(id) {
  const products = await getAllProducts();
  const product = products.find((p) => p.id === id);

  if (!product) return;

  productId.value = product.id;
  productName.value = product.name;
  productCategory.value = product.category;
  productPrice.value = product.price;
  productDescription.value = product.description;

  existingImages = [...product.images];
  selectedImages = [];

  imageInput.required = false;
  imageInput.value = "";

  formTitle.textContent = "Modifier le produit";
  saveButton.textContent = "Enregistrer les modifications";
  cancelButton.hidden = false;

  showImagePreview();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// REMOVE PRODUCT
async function removeProduct(id) {
  const confirmed = confirm("Veux-tu vraiment supprimer ce produit ?");

  if (!confirmed) return;

  await deleteProduct(id);
  await renderProducts();

  if (Number(productId.value) === id) {
    resetForm();
  }
}

// CANCEL EDIT
cancelButton.addEventListener("click", resetForm);

// START
async function init() {
  try {
    await openDatabase();
    await renderProducts();
  } catch (error) {
    console.error(error);
    alert("Impossible d'ouvrir la base de données locale.");
  }
}

init();
