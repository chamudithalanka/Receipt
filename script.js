// DOM Elements
const addRecipeBtn = document.getElementById('addRecipeBtn');
const modal = document.getElementById('recipeModal');
const closeBtn = document.querySelector('.close');
const recipeForm = document.getElementById('recipeForm');
const recipeGrid = document.getElementById('recipeGrid');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const mobileLangBtn = document.getElementById('mobileLangBtn');
const mobileLangMenu = document.getElementById('mobileLangMenu');
const desktopLangBtn = document.getElementById('desktopLangBtn');
const languageDropdown = document.getElementById('languageDropdown');
const currentLang = document.getElementById('currentLang');
const adSpace = document.getElementById('adSpace');

// Recipe Data
let recipes = JSON.parse(localStorage.getItem('recipes')) || [];
let editingRecipeId = null;

// Language handling
function changeLanguage(lang) {
    const langNames = {
        'en': 'English',
        'si': 'සිංහල',
        'ro': 'Română'
    };
    
    // Update the current language display
    currentLang.textContent = langNames[lang];

    // Function to reset translation
    const resetTranslation = () => {
        // Remove translation cookies
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.' + location.hostname;
        
        // Reload page if switching to English
        if (lang === 'en') {
            location.reload();
            return;
        }
    };

    // Function to trigger Google Translate
    const translatePage = (targetLang) => {
        try {
            // First, try using the combo box
            const $select = document.querySelector('select.goog-te-combo');
            if ($select) {
                $select.value = targetLang;
                $select.dispatchEvent(new Event('change'));
                return true;
            }

            // If combo box not found, try the iframe method
            const $frame = document.querySelector('.goog-te-menu-frame');
            if ($frame) {
                const $doc = $frame.contentDocument || $frame.contentWindow.document;
                const $items = $doc.querySelectorAll('.goog-te-menu2-item');
                
                let found = false;
                $items.forEach($item => {
                    const text = $item.textContent.toLowerCase();
                    if (
                        (targetLang === 'en' && text.includes('english')) ||
                        (targetLang === 'si' && text.includes('sinhala')) ||
                        (targetLang === 'ro' && text.includes('romanian'))
                    ) {
                        $item.querySelector('div').click();
                        found = true;
                    }
                });
                return found;
            }

            return false;
        } catch (error) {
            console.error('Translation error:', error);
            return false;
        }
    };

    // If switching to English, reset translation first
    if (lang === 'en') {
        resetTranslation();
    } else {
        // For other languages, try to translate
        const success = translatePage(lang);
        
        // If translation fails, reinitialize and try again
        if (!success) {
            // Remove existing Google Translate elements
            const oldElement = document.getElementById('google_translate_element');
            if (oldElement) oldElement.innerHTML = '';
            
            // Create new element and initialize
            const $div = document.createElement('div');
            $div.id = 'google_translate_element';
            document.body.appendChild($div);
            googleTranslateElementInit();
            
            // Try translation again after a delay
            setTimeout(() => {
                if (!translatePage(lang)) {
                    // If still fails, reload the page
                    localStorage.setItem('selectedLanguage', lang);
                    location.reload();
                }
            }, 1000);
        }
    }
    
    // Hide dropdowns
    languageDropdown.classList.add('hidden');
    mobileMenu.classList.add('hidden');
    mobileLangMenu.classList.add('hidden');
    
    // Store the selected language
    localStorage.setItem('selectedLanguage', lang);
}

// Desktop language dropdown toggle
desktopLangBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    languageDropdown.classList.toggle('hidden');
});

// Close language dropdown when clicking outside
document.addEventListener('click', () => {
    languageDropdown.classList.add('hidden');
    mobileLangMenu.classList.add('hidden');
});

// Prevent dropdown from closing when clicking inside it
languageDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
});

// Mobile Menu Toggle
mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
    mobileLangMenu.classList.add('hidden'); // Hide language menu when showing navigation
});

// Mobile Language Button Toggle
mobileLangBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    mobileLangMenu.classList.toggle('hidden');
    mobileMenu.classList.add('hidden'); // Hide navigation when showing language menu
});

// Close mobile menus when clicking outside
document.addEventListener('click', (e) => {
    if (!mobileMenuBtn.contains(e.target) && 
        !mobileMenu.contains(e.target) && 
        !mobileLangBtn.contains(e.target) &&
        !mobileLangMenu.contains(e.target)) {
        mobileMenu.classList.add('hidden');
        mobileLangMenu.classList.add('hidden');
    }
});

// Initialize Google Translate
function googleTranslateElementInit() {
    new google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: 'en,si,ro',
        layout: google.translate.TranslateElement.FloatPosition.TOP_LEFT,
        autoDisplay: false,
        multilanguagePage: true
    }, 'google_translate_element');

    // Wait for Google Translate to initialize
    const checkTranslate = setInterval(() => {
        const $select = document.querySelector('select.goog-te-combo');
        const $frame = document.querySelector('.goog-te-menu-frame');
        
        if ($select || $frame) {
            clearInterval(checkTranslate);
            
            // Restore previously selected language
            const savedLang = localStorage.getItem('selectedLanguage');
            if (savedLang && savedLang !== 'en') {
                setTimeout(() => {
                    changeLanguage(savedLang);
                }, 1000);
            }
        }
    }, 100);
}

// Event Listeners
addRecipeBtn.addEventListener('click', () => {
    editingRecipeId = null;
    document.querySelector('.modal-content h2').textContent = 'Add New Recipe';
    recipeForm.reset();
    modal.classList.remove('hidden');
});

closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    editingRecipeId = null;
    recipeForm.reset();
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.add('hidden');
        editingRecipeId = null;
        recipeForm.reset();
    }
});

recipeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const recipeData = {
        id: editingRecipeId || Date.now(),
        name: document.getElementById('recipeName').value,
        ingredients: document.getElementById('ingredients').value.split('\n').filter(ingredient => ingredient.trim() !== ''),
        instructions: document.getElementById('instructions').value,
        cookingTime: document.getElementById('cookingTime').value,
        imageUrl: document.getElementById('imageUrl').value || 'https://via.placeholder.com/300x200?text=No+Image',
        dateAdded: editingRecipeId ? recipes.find(r => r.id === editingRecipeId).dateAdded : new Date().toLocaleDateString()
    };

    if (editingRecipeId) {
        recipes = recipes.map(recipe => recipe.id === editingRecipeId ? recipeData : recipe);
    } else {
        recipes.push(recipeData);
    }

    saveRecipes();
    displayRecipes();
    recipeForm.reset();
    modal.classList.add('hidden');
    editingRecipeId = null;
});

// Functions
function saveRecipes() {
    localStorage.setItem('recipes', JSON.stringify(recipes));
}

function deleteRecipe(id) {
    if (confirm('Are you sure you want to delete this recipe?')) {
        recipes = recipes.filter(recipe => recipe.id !== id);
        saveRecipes();
        displayRecipes();
    }
}

function editRecipe(id) {
    const recipe = recipes.find(r => r.id === id);
    if (recipe) {
        editingRecipeId = id;
        document.getElementById('recipeName').value = recipe.name;
        document.getElementById('ingredients').value = recipe.ingredients.join('\n');
        document.getElementById('instructions').value = recipe.instructions;
        document.getElementById('cookingTime').value = recipe.cookingTime;
        document.getElementById('imageUrl').value = recipe.imageUrl;
        document.querySelector('.modal-content h2').textContent = 'Edit Recipe';
        modal.classList.remove('hidden');
    }
}

function displayRecipes() {
    recipeGrid.innerHTML = '';
    recipes.forEach(recipe => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl shadow-lg overflow-hidden transition-transform duration-300 hover:-translate-y-2';
        card.innerHTML = `
            <div class="relative">
                <img src="${recipe.imageUrl}" alt="${recipe.name}" class="w-full h-48 object-cover">
                <div class="absolute top-4 right-4 bg-white rounded-full px-3 py-1 flex items-center space-x-1 shadow-md">
                    <i class="fas fa-clock text-red-500"></i>
                    <span class="text-gray-700 font-medium">${recipe.cookingTime} min</span>
                </div>
            </div>
            <div class="p-5">
                <h3 class="text-xl font-semibold text-gray-800 mb-2">${recipe.name}</h3>
                <div class="flex items-center space-x-2 text-gray-600 mb-4">
                    <i class="fas fa-list-ul"></i>
                    <span>${recipe.ingredients.length} ingredients</span>
                </div>
                <div class="flex space-x-2">
                    <button onclick="showRecipeDetails(${recipe.id})" 
                        class="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg flex items-center justify-center space-x-2 transition duration-300">
                        <i class="fas fa-eye"></i>
                        <span>View</span>
                    </button>
                    <button onclick="editRecipe(${recipe.id})"
                        class="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg flex items-center justify-center space-x-2 transition duration-300">
                        <i class="fas fa-edit"></i>
                        <span>Edit</span>
                    </button>
                    <button onclick="deleteRecipe(${recipe.id})"
                        class="bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg flex items-center justify-center transition duration-300">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        recipeGrid.appendChild(card);
    });
}

function showRecipeDetails(id) {
    const recipe = recipes.find(r => r.id === id);
    const detailsModal = document.createElement('div');
    detailsModal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
    detailsModal.innerHTML = `
        <div class="bg-white rounded-xl shadow-xl w-11/12 max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-semibold text-gray-800">${recipe.name}</h2>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                    class="text-gray-500 hover:text-gray-700 text-2xl focus:outline-none">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <img src="${recipe.imageUrl}" alt="${recipe.name}" class="w-full h-64 object-cover rounded-lg mb-4">
            <div class="flex items-center space-x-2 text-gray-600 mb-4">
                <i class="fas fa-clock text-red-500"></i>
                <span>${recipe.cookingTime} minutes</span>
            </div>
            <div class="mb-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Ingredients:</h3>
                <ul class="list-disc list-inside space-y-1 text-gray-600">
                    ${recipe.ingredients.map(ing => `<li>${ing}</li>`).join('')}
                </ul>
            </div>
            <div class="mb-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Instructions:</h3>
                <p class="text-gray-600 whitespace-pre-line">${recipe.instructions}</p>
            </div>
            <div class="flex justify-between items-center text-sm text-gray-500">
                <span>Added on: ${recipe.dateAdded}</span>
                <button onclick="editRecipe(${recipe.id}); this.parentElement.parentElement.parentElement.remove();"
                    class="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg flex items-center space-x-2 transition duration-300">
                    <i class="fas fa-edit"></i>
                    <span>Edit Recipe</span>
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(detailsModal);
}

// Advertisement handling
function setAdvertisement(svgContent) {
    if (!adSpace) return;
    
    // Clear existing content
    adSpace.innerHTML = '';
    
    if (svgContent) {
        // Create a container that maintains aspect ratio
        const adContainer = document.createElement('div');
        adContainer.className = 'w-full h-full';
        
        // Modify SVG to maintain exact dimensions while being responsive
        const modifiedSvg = svgContent
            .replace(
                '<svg',
                '<svg style="width: 100%; height: 100%; max-width: 970px; max-height: 90px;"'
            )
            .replace(
                'viewBox="0 0 970 90"',
                'viewBox="0 0 970 90" preserveAspectRatio="xMidYMid meet"'
            );
        
        adContainer.innerHTML = modifiedSvg;
        
        // Ensure SVG maintains its dimensions
        const svg = adContainer.querySelector('svg');
        if (svg) {
            // Set exact dimensions while allowing scaling down for smaller screens
            svg.style.width = '100%';
            svg.style.height = '100%';
            svg.style.minHeight = '90px';
            svg.style.objectFit = 'contain';
            
            // Center the SVG in the container
            adContainer.style.display = 'flex';
            adContainer.style.justifyContent = 'center';
            adContainer.style.alignItems = 'center';
        }
        
        adSpace.appendChild(adContainer);
    } else {
        // Modern default advertisement design with animation effects
        adSpace.innerHTML = `
            <div class="w-full h-full bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-500 cursor-pointer overflow-hidden relative group">
                <!-- Background pattern -->
                <div class="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                    <div class="absolute inset-0" style="background-image: url('data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%234338ca\' fill-opacity=\'0.2\'%3E%3Cpath d=\'M0 0h10v10H0zM10 10h10v10H10z\'/%3E%3C/g%3E%3C/svg%3E')"></div>
                </div>
                
                <!-- Content container -->
                <div class="relative w-full h-full flex items-center justify-center px-2 sm:px-4">
                    <!-- Left icon group -->
                    <div class="absolute left-2 sm:left-8 flex space-x-2 sm:space-x-4 transform -translate-x-2 group-hover:translate-x-0 opacity-60 group-hover:opacity-100 transition-all duration-500">
                        <i class="fas fa-chart-line text-lg sm:text-2xl text-indigo-600"></i>
                        <i class="fas fa-bullhorn text-lg sm:text-2xl text-indigo-600 hidden sm:block"></i>
                    </div>
                    
                    <!-- Center text -->
                    <div class="text-center transform group-hover:scale-105 transition-transform duration-500">
                        <h3 class="text-base sm:text-xl font-bold text-indigo-600 mb-0 sm:mb-1">Advertising Space Available</h3>
                        <p class="text-xs sm:text-sm text-indigo-500">Premium 970×90 Banner Position</p>
                    </div>
                    
                    <!-- Right icon group -->
                    <div class="absolute right-2 sm:right-8 flex space-x-2 sm:space-x-4 transform translate-x-2 group-hover:translate-x-0 opacity-60 group-hover:opacity-100 transition-all duration-500">
                        <i class="fas fa-globe text-lg sm:text-2xl text-indigo-600"></i>
                        <i class="fas fa-rocket text-lg sm:text-2xl text-indigo-600 hidden sm:block"></i>
                    </div>
                    
                    <!-- Hover effect overlay -->
                    <div class="absolute inset-0 border-2 border-indigo-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"></div>
                </div>
            </div>
        `;
    }
}

// Initial display
displayRecipes();

// Set the advertisement when the page loads
document.addEventListener('DOMContentLoaded', () => {
    setAdvertisement(); // Call without parameters to show the default design
});

// Scroll to Top Functionality
const scrollToTopBtn = document.getElementById('scrollToTop');

// Show/hide button based on scroll position
window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) { // Show button after 300px scroll
        scrollToTopBtn.classList.remove('invisible', 'opacity-0');
        scrollToTopBtn.classList.add('opacity-100');
    } else {
        scrollToTopBtn.classList.remove('opacity-100');
        scrollToTopBtn.classList.add('opacity-0');
        // Add invisible class after fade out
        setTimeout(() => {
            if (window.pageYOffset <= 300) {
                scrollToTopBtn.classList.add('invisible');
            }
        }, 300);
    }
});

// Smooth scroll to top when button is clicked
scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Initial check for scroll position
window.dispatchEvent(new Event('scroll'));
