
// --- SÉLECTEURS DU DOM ---
// La première ligne vérifie si le document est prêt avant d'initialiser, 
// cela garantit que ces éléments ne seront pas 'null' si le script est chargé trop tôt.
const productDetailModal = document.getElementById("product-detail");
const productContainer = document.getElementById("product-grid");
const btnCloseDetail = document.getElementById("close-detail");
const showformBtn = document.getElementById("showform");
const formSection = document.getElementById("formsection");
const closeAddFormBtn = document.getElementById("closeform");
const formAddNewProduct = document.getElementById("formAddProduct");
const categoryFiltersContainer = document.getElementById("category-filters");
const navItems = document.querySelectorAll('.sidebar .nav li');
const pageTitle = document.getElementById('page-title');
const dashboardCards = document.getElementById('dashboard-cards');
const productsPage = document.getElementById('products-page');
const sortBySelect = document.getElementById('sort-by');
const searchInput = document.getElementById('search-input');


// SECTION PANIER
const cartPage = document.getElementById("cartPage");
const cartContainer2 = document.getElementById("cartContainer");


// Pour le détail de la modale 
const detailImage = document.getElementById("detail-image");
const detailTitle = document.getElementById("detail-title");
const detailPrice = document.getElementById("detail-price");
const detailDescription = document.getElementById("detail-description");

// Pour la modale d'ajout/update
const formHeading = document.querySelector("#formsection h2");
const cartCountDisplay = document.getElementById("cart-count");


// --- VARIABLES GLOBALES ---
let allProducts = [];
let cart = [];
let currentProductIdToUpdate = null;

// --- FONCTIONS LOCALSTORAGE ---

function saveProductsToLocalStorage() {
    localStorage.setItem('localProducts', JSON.stringify(allProducts));
}

function loadProductsFromLocalStorage() {
    const localData = localStorage.getItem('localProducts');
    if (localData) {
        try {
            allProducts = JSON.parse(localData);
            return true;
        } catch (e) {
            console.error("Erreur de parsing des données locales:", e);
            localStorage.removeItem('localProducts');
        }
    }
    return false;
}

function saveCartToLocalStorage() {
    localStorage.setItem('localCart', JSON.stringify(cart));
}

function loadCartFromLocalStorage() {
    const localCartData = localStorage.getItem('localCart');
    if (localCartData) {
        try {
            cart = JSON.parse(localCartData);
        } catch (e) {
            console.error("Erreur de parsing des données du panier:", e);
            localStorage.removeItem('localCart');
        }
    }
}

// --- INITIALISATION ---

function initDashboard() {
    setupEventListeners();
    loadCartFromLocalStorage();

    if (loadProductsFromLocalStorage()) {
        updateDashboardStats(allProducts);
        setupCategoryFilters(allProducts);

        const currentPage = document.querySelector('.sidebar .nav li.active')?.dataset.page || 'overview';
        renderPage(currentPage);

        if (currentPage === 'products') {
            displayProducts(allProducts);
        }
    } else {
        fetchProducts();
        renderPage('overview');
    }
}

// --- NAVIGATION SPA ---

function renderPage(pageName) {
    if (dashboardCards) dashboardCards.style.display = 'none';
    if (productsPage) productsPage.style.display = 'none';

    closeFormSection();
    closeDetailModal();

    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageName) {
            item.classList.add('active');
        }
    });

    if (pageTitle) pageTitle.textContent = pageName.charAt(0).toUpperCase() + pageName.slice(1);

    if (searchInput) {
        searchInput.value = '';
    }

    if (pageName === 'overview' && dashboardCards) {
        dashboardCards.style.display = 'flex';
    } else if (pageName === 'products' && productsPage) {
        productsPage.style.display = 'block';
        if (allProducts.length > 0) {
            displayProducts(allProducts);
        }
    } else if (pageName === 'categories' && productsPage) {
        productsPage.style.display = 'block';
        renderCategoriesPage();
    } else if (pageName === 'cart' && cartPage) {

        productsPage.style.display = 'none';
        cartPage.style.display = 'block'

        // Récupérer le panier depuis localStorage
        const cart = JSON.parse(localStorage.getItem("localCart")) || [];

        // Sélectionner le conteneur
        if (cartContainer2) {
            cartContainer2.innerHTML = `
            <div class="header">Cart</div>
            <h2>Votre panier</h2>
            <div id="cartList" style="margin-top:20px;"></div>
            <div id="cartContainer2"></div>
        `;
        }

        const cartContent = document.getElementById("cartList");

        // Si panier vide
        if (cart.length === 0) {
            cartContent.innerHTML = "<p>Votre panier est vide.</p>";
            return;
        }

        let div2 = document.createElement("div");
        div2.style = "paddind:10px;border-radius:5px;box-shadow:1px 1px 3px rgba(0,0,0,0.3);margin:3px;";
        let button2 = document.createElement("button");
        button.style = "background:red;color:#fff;border:none;padding:8px 12px;border-radius:5px;cursor:pointer;"

        
        // Afficher chaque produit
        cart.forEach(item => {
            const div = document.createElement("div");
            div.style = "padding:10px;border:1px solid #ccc;border-radius:15px;margin-bottom:5px;display:flex;gap:20px;align-items:center;";

            div.innerHTML = `
            <img src="${item.image}" alt="${item.title}" style="width:80px;height:80px;object-fit:contain;" />
            <div style="flex:1;">
                <p><strong>${item.title}</strong></p>
                <p>Prix: $${item.price}</p>
                <p>Quantité: ${item.quantity}</p>
            </div>
            <button class="btn-delete" style="background:#e74c3c;color:#fff;border:none;padding:8px 12px;border-radius:5px;cursor:pointer;">
                Supprimer
            </button>
        `;

            // Bouton supprimer
            div.querySelector(".btn-delete").addEventListener("click", () => {
                removeFromCart(item.id);
                renderPage("cart"); // rafraîchir la page panier
            });

            cartContent.appendChild(div);
        });

        // Mettre à jour le titre
        const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);
        if (pageTitle) pageTitle.textContent = `Cart (${cartItemsCount} items)`;
    }



}


// --- PRODUITS ET AFFICHAGE ---

function fetchProducts() {
    if (allProducts.length > 0) return;

    fetch("https://fakestoreapi.com/products")
        .then((res) => res.json())
        .then((products) => {
            // Ajouter un offset de 10000 aux IDs de l'API (1 -> 10001)
            allProducts = products.map(p => ({
                ...p,
                id: parseInt(p.id) + 10000
            }));
            saveProductsToLocalStorage();
            updateDashboardStats(allProducts);
            setupCategoryFilters(products);

            const currentPage = document.querySelector('.sidebar .nav li.active')?.dataset.page || 'overview';
            if (currentPage === 'products') {
                displayProducts(allProducts);
            }
        })
        .catch((err) => {
            console.error("Erreur lors de la récupération des produits:", err);
            if (productContainer) productContainer.innerHTML = '<p style="color: red;">Désolé, impossible de charger les produits depuis l\'API.</p>';
        });
}

function cardProduct(product) {
    let div = document.createElement("div");
    div.className = "product-card";
    div.dataset.category = product.category;

    let img = document.createElement("img");
    img.src = product.image;
    img.alt = product.title;

    let h4 = document.createElement("h4");
    h4.textContent = product.title;

    let span = document.createElement("span");
    span.textContent = "$" + product.price;

    let buttonGridContainer = document.createElement("div");
    buttonGridContainer.className = "button-grid-container";

    // Bouton 1: Voir Détail (See more)
    let btnDetail = document.createElement("button");
    btnDetail.textContent = "See more";
    btnDetail.className = "btn btn-detail";
    btnDetail.addEventListener("click", () => {
        showModalDetail(product.id);
    });

    // Bouton 2: Ajouter au Panier (Add to cart)
    let btnAddCart = document.createElement("button");
    btnAddCart.textContent = "Add to cart";
    btnAddCart.className = "btn btn-add-cart";
    btnAddCart.addEventListener("click", () => {
        addToCart(product);
    });

    // Bouton 3: Supprimer (Delete)
    let btnDelete = document.createElement("button");
    btnDelete.textContent = "Delete";
    btnDelete.className = "btn btn-delete";
    btnDelete.addEventListener("click", () => {
        deleteProduct(product.id);
    });

    // Bouton 4: Mettre à jour (Update)
    let btnUpdate = document.createElement("button");
    btnUpdate.textContent = "Update";
    btnUpdate.className = "btn btn-update";
    btnUpdate.addEventListener("click", () => {
        showUpdateModal(product.id);
    });

    buttonGridContainer.appendChild(btnDetail);
    buttonGridContainer.appendChild(btnAddCart);
    buttonGridContainer.appendChild(btnDelete);
    buttonGridContainer.appendChild(btnUpdate);

    div.appendChild(img);
    div.appendChild(h4);
    div.appendChild(span);
    div.appendChild(buttonGridContainer);

    return div;
}

function displayProducts(productsToDisplay) {
    if (document.querySelector('.sidebar .nav li.active')?.dataset.page === 'categories') {
        return;
    }

    if (!productContainer) return;

    if (productsToDisplay.length === 0) {
        productContainer.innerHTML = "<p style='grid-column: 1 / -1; text-align: center;'>Aucun produit trouvé pour la recherche ou le filtre actuel.</p>";
        return;
    }

    productContainer.innerHTML = "";
    productsToDisplay.forEach((product) => {
        let card = cardProduct(product);
        productContainer.appendChild(card);
    });
}

// --- LOGIQUE DES BOUTONS (RENDUE FONCTIONNELLE) ---

/**
 * Fonctionnalité: See more (Affiche les détails du produit depuis l'API )
 */
function showModalDetail(productId) {
    const localProduct = allProducts.find(p => p.id === productId);

    // Vérification de sécurité des éléments DOM et du produit
    if (!productDetailModal || !detailImage || !detailTitle || !detailPrice || !detailDescription || !localProduct) {
        console.error("Éléments de détail ou produit local introuvable. Vérifiez les IDs HTML ou les données.");
        if (productDetailModal) closeDetailModal();
        return;
    }

    // Afficher un état de chargement
    detailTitle.textContent = "Chargement des détails...";
    detailImage.src = 'https://via.placeholder.com/150';
    detailPrice.textContent = '...';
    detailDescription.textContent = '...';
    productDetailModal.classList.replace("close-modal", "show-modal");

    // Si l'ID est très grand (Date.now()), c'est un produit ajouté localement (non API)
    // On utilise 20000 comme seuil, car les IDs API sont <= 10020
    if (localProduct.id > 20000) {
        // C'est un produit ajouté par l'utilisateur
        detailImage.src = localProduct.image;
        detailTitle.textContent = localProduct.title + " (Donnée Locale)";
        detailPrice.textContent = `$${localProduct.price}`;
        detailDescription.textContent = localProduct.description;
        return;
    }

    // C'est un produit de l'API, on utilise l'ID API  (ID - 10000)
    fetch(`https://fakestoreapi.com/products/${localProduct.id - 10000}`)
        .then(res => {
            if (!res.ok) throw new Error(`Erreur API: ${res.status}`);
            return res.json();
        })
        .then(product => {
            detailImage.src = product.image;
            detailTitle.textContent = product.title;
            detailPrice.textContent = `$${product.price}`;
            detailDescription.textContent = product.description;
        })
        .catch(error => {
            console.error("Erreur lors de la récupération du détail du produit (API échouée):", error);
            // Utiliser les données locales en cas d'échec
            detailImage.src = localProduct.image;
            detailTitle.textContent = localProduct.title + " (API ÉCHOUÉE)";
            detailPrice.textContent = `$${localProduct.price}`;
            detailDescription.textContent = localProduct.description;
        });
}


/**
 * Fonctionnalité: Delete (Supprime le produit)
 */
function deleteProduct(id) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
        return;
    }
    allProducts = allProducts.filter(p => p.id !== id);
    saveProductsToLocalStorage();
    displayProducts(allProducts);
    updateDashboardStats(allProducts);
    alert(`Produit supprimé.`);
}

/**
 * Fonctionnalité: Add to cart (Ajoute au panier)
 */
function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    saveCartToLocalStorage();
    updateDashboardStats();
    alert(`${product.title} ajouté au panier.`);
}

function removeFromCart(productId) {
    // Charger le panier depuis le localStorage
    let cart = JSON.parse(localStorage.getItem("localCart")) || [];

    // Trouver l'item dans le panier
    const item = cart.find(p => p.id === productId);

    if (!item) return; // Si l'item n'existe pas, on ne fait rien

    // Si quantité > 1 → décrémenter
    if (item.quantity > 1) {
        item.quantity -= 1;
    } 
    // Sinon → supprimer complètement
    else {
        cart = cart.filter(p => p.id !== productId);
    }

    // Sauvegarder le panier mis à jour
    localStorage.setItem("localCart", JSON.stringify(cart));

    // Mettre à jour le dashboard
    updateDashboardStats();
}

/**
 * Fonctionnalité: Update (Ouvre le formulaire pré-rempli pour la modification)
 */
function showUpdateModal(productId) {
    currentProductIdToUpdate = productId;
    const product = allProducts.find(p => p.id === productId);

    if (product) {
        // Définir le mode "Update"
        if (formHeading) formHeading.textContent = "Modifier le Produit";

        // Pré-remplir le formulaire 
        const categoryInput = document.getElementById('category');
        const titleInput = document.getElementById('title');
        const priceInput = document.getElementById('price');
        const imageInput = document.getElementById('image');
        const descriptionInput = document.getElementById('description');

        if (categoryInput) categoryInput.value = product.category;
        if (titleInput) titleInput.value = product.title;
        if (priceInput) priceInput.value = product.price;
        if (imageInput) imageInput.value = product.image;
        if (descriptionInput) descriptionInput.value = product.description;

        // Ouvrir la modale
        if (formSection) formSection.classList.replace("close-modal", "show-modal");
    } else {
        alert("Produit à modifier introuvable.");
    }
}

function closeDetailModal() {
    if (productDetailModal) productDetailModal.classList.replace("show-modal", "close-modal");
}

function closeFormSection() {
    if (formSection) formSection.classList.replace("show-modal", "close-modal");
    if (formAddNewProduct) formAddNewProduct.reset();
    if (formHeading) formHeading.textContent = "Add new Product";
    currentProductIdToUpdate = null;
}

// --- GESTION DU DASHBOARD ET DES FILTRES ---

function updateDashboardStats(products = allProducts) {
    const totalProducts = products.length;
    const totalCategories = [...new Set(products.map(p => p.category))].length;

    const totalCartItems = cart.reduce((total, item) => total + item.quantity, 0);

    const totalProductsEl = document.getElementById("total-products");
    if (totalProductsEl) totalProductsEl.textContent = totalProducts;

    const totalCategoriesEl = document.getElementById("total-categories");
    if (totalCategoriesEl) totalCategoriesEl.textContent = totalCategories;

    if (cartCountDisplay) cartCountDisplay.textContent = totalCartItems;
}

function setupCategoryFilters(products) {
    const categories = [...new Set(products.map(p => p.category))];
    if (categoryFiltersContainer) {
        categoryFiltersContainer.innerHTML = '<button class="btn-filter active" data-filter="all">All Categories</button>';
        categories.forEach(category => {
            const button = document.createElement('button');
            button.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            button.className = 'btn-filter';
            button.dataset.filter = category;
            categoryFiltersContainer.appendChild(button);
        });
    }
}

function searchProducts(searchTerm) {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    const searchedProducts = allProducts.filter(product => {
        const matchesTitle = product.title.toLowerCase().includes(lowerCaseSearchTerm);
        const matchesCategory = product.category.toLowerCase().includes(lowerCaseSearchTerm);
        const matchesId = String(product.id).includes(lowerCaseSearchTerm);

        return matchesTitle || matchesCategory || matchesId;
    });

    displayProducts(searchedProducts);

    document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'));
    const allFilterBtn = document.querySelector('.btn-filter[data-filter="all"]');
    if (allFilterBtn) {
        allFilterBtn.classList.add('active');
    }
    if (sortBySelect) {
        sortBySelect.value = 'default';
    }
}

function filterProducts(filterValue) {
    if (searchInput) {
        searchInput.value = '';
    }

    const productsToDisplay = filterValue === 'all'
        ? allProducts
        : allProducts.filter(p => p.category === filterValue);

    displayProducts(productsToDisplay);

    document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.btn-filter[data-filter="${filterValue}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    if (sortBySelect) {
        sortBySelect.value = 'default';
    }
}

function sortProducts(products, sortBy) {
    if (sortBy === 'default') {
        return [...products].sort((a, b) => a.id - b.id);
    }

    const sortedProducts = [...products];

    switch (sortBy) {
        case 'price-asc':
            sortedProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            sortedProducts.sort((a, b) => b.price - a.price);
            break;
        case 'name-asc':
            sortedProducts.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'name-desc':
            sortedProducts.sort((a, b) => b.title.localeCompare(a.title));
            break;
    }
    return sortedProducts;
}

function renderCategoriesPage() {
    if (!productContainer) return;
    productContainer.innerHTML = '';
    productContainer.style.display = 'block';

    const categories = [...new Set(allProducts.map(p => p.category))];

    const ul = document.createElement('ul');
    ul.style.cssText = 'list-style: disc; padding-left: 20px;';

    categories.forEach(category => {
        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
        const li = document.createElement('li');
        li.style.cssText = 'padding: 8px 0; cursor: pointer;';
        li.textContent = categoryName;
        li.dataset.filter = category;

        li.addEventListener('click', () => {
            renderPage('products');
            filterProducts(category);
        });

        ul.appendChild(li);
    });

    const h3 = document.createElement('h3');
    h3.textContent = 'Liste des Catégories disponibles :';

    productContainer.appendChild(h3);
    productContainer.appendChild(ul);
}


// --- GESTION DES ÉVÉNEMENTS ---

function setupEventListeners() {
    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            renderPage(e.target.dataset.page);
        });
    });

    // ÉCOUTEUR DE RECHERCHE
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchProducts(e.target.value);
        });
    }

    // Autres écouteurs (avec vérification de l'existence des éléments)
    if (btnCloseDetail) btnCloseDetail.addEventListener("click", closeDetailModal);

    if (showformBtn) {
        showformBtn.addEventListener("click", () => {
            if (formHeading) formHeading.textContent = "Add new Product";
            currentProductIdToUpdate = null;
            if (formSection) formSection.classList.replace("close-modal", "show-modal");
        });
    }
    if (closeAddFormBtn) closeAddFormBtn.addEventListener("click", closeFormSection);

    // Soumission du formulaire (CREATE & UPDATE)
    if (formAddNewProduct) {
        formAddNewProduct.addEventListener("submit", (event) => {
            event.preventDefault();
            const data = new FormData(formAddNewProduct);
            const productData = Object.fromEntries(data.entries());

            if (!productData.title || !productData.category || !productData.price) {
                alert("Le titre, la catégorie et le prix sont requis.");
                return;
            }

            if (currentProductIdToUpdate !== null) {
                // MODE UPDATE
                const index = allProducts.findIndex(p => p.id === currentProductIdToUpdate);
                if (index !== -1) {
                    const updatedProduct = {
                        ...allProducts[index],
                        ...productData,
                        price: parseFloat(productData.price)
                    };
                    allProducts[index] = updatedProduct;
                    alert('Produit mis à jour (stocké localement).');
                }
            } else {
                // MODE CREATE
                const newProduct = {
                    id: Date.now(), // ID unique (très grand, pour être identifié comme local)
                    title: productData.title,
                    price: parseFloat(productData.price),
                    description: productData.description || 'Description non fournie.',
                    category: productData.category,
                    image: productData.image || 'https://via.placeholder.com/150',
                    rating: { rate: 0, count: 0 }
                };
                allProducts.push(newProduct);
                alert('Produit ajouté (stocké localement).');
            }

            saveProductsToLocalStorage();
            displayProducts(allProducts);
            updateDashboardStats(allProducts);
            closeFormSection();
        });
    }

    // Écouteur de Tri
    if (sortBySelect) {
        sortBySelect.addEventListener('change', () => {
            let listToSort = allProducts;
            const activeFilter = document.querySelector('.btn-filter.active')?.dataset.filter;
            if (activeFilter && activeFilter !== 'all') {
                listToSort = listToSort.filter(p => p.category === activeFilter);
            }

            const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
            if (searchTerm) {
                listToSort = listToSort.filter(p => p.title.toLowerCase().includes(searchTerm) || p.category.toLowerCase().includes(searchTerm) || String(p.id).includes(searchTerm));
            }

            const sortedList = sortProducts(listToSort, sortBySelect.value);
            displayProducts(sortedList);
        });
    }

    // Écouteur de Filtres
    if (categoryFiltersContainer) {
        categoryFiltersContainer.addEventListener('click', (e) => {
            const filterValue = e.target.dataset.filter;
            if (filterValue) {
                filterProducts(filterValue);
            }
        });
    }
}

// Démarrage: 
document.addEventListener('DOMContentLoaded', initDashboard);