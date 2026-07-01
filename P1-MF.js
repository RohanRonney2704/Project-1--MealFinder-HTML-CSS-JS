const $ = (s) => document.querySelector(s);

// Centralized ThemealDB endpoints
const MealDB = {
    base: 'https://www.themealdb.com/api/json/v1/1',
    categories: (/* no params */) => `${'https://www.themealdb.com/api/json/v1/1'}/categories.php`,
    searchByName: (foodName) => `${'https://www.themealdb.com/api/json/v1/1'}/search.php?s=${encodeURIComponent(foodName)}`,
    lookupById: (id) => `${'https://www.themealdb.com/api/json/v1/1'}/lookup.php?i=${id}`,
    filterByCategory: (category) => `${'https://www.themealdb.com/api/json/v1/1'}/filter.php?c=${encodeURIComponent(category)}`,
};


const els = {
    drawer: $('#drawer'), menuBtn: $('#menuBtn'), closeBtn: $('#closeBtn'),
    catList: $('#catList'), catGrid: $('#catGrid'),
    searchInput: $('#searchInput'), searchBtn: $('#searchBtn'),
    mealsSection: $('#mealsSection'), mealsGrid: $('#mealsGrid'),
    catInfo: $('#catInfo'), mealDetail: $('#mealDetail'),
    crumb: $('#crumb'), categoriesSection: $('#categoriesSection'),
};

const get = (url) => fetch(url).then(r => r.json());

// Drawer
els.menuBtn.onclick = () => els.drawer.classList.add('open');
els.closeBtn.onclick = () => els.drawer.classList.remove('open');

// Load categories
async function loadCategories() {
    const { categories } = await get(MealDB.categories());

    els.catGrid.innerHTML = categories.map(c => `
    <div class="card" data-cat="${c.strCategory}">
      <span class="tag">${c.strCategory.toUpperCase()}</span>
      <img src="${c.strCategoryThumb}" alt="${c.strCategory}" />
    </div>
  `).join('');
    els.catList.innerHTML = categories.map(c => `<li data-cat="${c.strCategory}">${c.strCategory}</li>`).join('');

    document.querySelectorAll('[data-cat]').forEach(el => {
        el.onclick = () => {
            const cat = el.dataset.cat;
            const meta = categories.find(c => c.strCategory === cat);
            showCategory(cat, meta.strCategoryDescription);
            els.drawer.classList.remove('open');
        };
    });
}



async function showCategory(cat, desc) {
    resetViews();
    els.catInfo.classList.remove('hidden');
    els.catInfo.innerHTML = `<h3>${cat}</h3><p>${desc}</p>`;
    const { meals } = await get(MealDB.filterByCategory(cat));

    renderMeals(meals || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function searchMeals(q) {
    if (!q.trim()) return;
    resetViews();
    const { meals } = await get(MealDB.searchByName(q));

    renderMeals(meals || []);
}

function renderMeals(meals) {
    els.mealsSection.classList.remove('hidden');
    if (!meals.length) {
        els.mealsGrid.innerHTML = '<p>No meals found.</p>';
        return;
    }
    els.mealsGrid.innerHTML = meals.map(m => `
    <div class="card" data-id="${m.idMeal}">
      ${m.strCategory ? `<span class="tag">${m.strCategory}</span>` : ''}
      <img src="${m.strMealThumb}" alt="${m.strMeal}" />
      <div class="name">
        ${m.strArea ? `<div class="area">${m.strArea}</div>` : ''}
        ${m.strMeal}
      </div>
    </div>
  `).join('');
    els.mealsGrid.querySelectorAll('[data-id]').forEach(el => {
        el.onclick = () => showMeal(el.dataset.id);
    });
}

async function showMeal(id) {
    const { meals } = await get(MealDB.lookupById(id));

    const m = meals[0];
    resetViews();
    els.crumb.classList.remove('hidden');
    els.crumb.innerHTML = `🏠 » ${m.strMeal.toUpperCase()}`;
    els.mealDetail.classList.remove('hidden');

    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
        const ing = m[`strIngredient${i}`], mea = m[`strMeasure${i}`];
        if (ing && ing.trim()) ingredients.push(`${ing} - ${mea || ''}`);
    }

    els.mealDetail.innerHTML = `
    <div class="top">
      <img src="${m.strMealThumb}" alt="${m.strMeal}" />
      <div>
        <h2>${m.strMeal}</h2>
        <div class="meta"><b>CATEGORY:</b> ${m.strCategory}</div>
        ${m.strArea ? `<div class="meta"><b>AREA:</b> ${m.strArea}</div>` : ''}
        ${m.strSource ? `<div class="meta"><b>Source:</b> <a href="${m.strSource}" target="_blank">${m.strSource}</a></div>` : ''}
        ${m.strTags ? `<div class="meta"><b>Tags:</b> ${m.strTags}</div>` : ''}
        <div class="ingredients">
          <h4>Ingredients</h4>
          <ol>${ingredients.map(i => `<li>${i}</li>`).join('')}</ol>
        </div>
      </div>
    </div>
    <div class="instructions">
      <h4>Instructions:</h4>
      <p>${m.strInstructions.replace(/\n/g, '<br><br>')}</p>
    </div>
  `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetViews() {
    els.catInfo.classList.add('hidden');
    els.mealDetail.classList.add('hidden');
    els.mealsSection.classList.add('hidden');
    els.crumb.classList.add('hidden');
}

els.searchBtn.onclick = () => searchMeals(els.searchInput.value);
els.searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') searchMeals(els.searchInput.value);
});

loadCategories();