const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Чтение данных из JSON файла
const readProductsData = async () => {
  try {
    const data = await fs.readFile(path.join(__dirname, 'data', 'products.json'), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading products data:', error);
    return { products: [] };
  }
};

// Функция для фильтрации продуктов
const filterProducts = (products, filters) => {
  return products.filter(product => {
    // Фильтрация по категории
    if (filters.category && product.category !== filters.category) {
      return false;
    }

    // Фильтрация по цене
    if (filters.minPrice && product.price < Number(filters.minPrice)) {
      return false;
    }
    if (filters.maxPrice && product.price > Number(filters.maxPrice)) {
      return false;
    }

    // Фильтрация по размерам
    if (filters.minLength && product.dimensions.length < Number(filters.minLength)) {
      return false;
    }
    if (filters.maxLength && product.dimensions.length > Number(filters.maxLength)) {
      return false;
    }
    if (filters.minWidth && product.dimensions.width < Number(filters.minWidth)) {
      return false;
    }
    if (filters.maxWidth && product.dimensions.width > Number(filters.maxWidth)) {
      return false;
    }

    return true;
  });
};

// Получение списка продуктов с пагинацией
app.get('/api/products', async (req, res) => {
  try {
    const { page = 1, limit = 10, ...filters } = req.query;
    const data = await readProductsData();
    let products = [...data.products];

    // Применяем фильтры
    products = filterProducts(products, filters);

    // Пагинация
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedProducts = products.slice(startIndex, endIndex);

    // Формирование ответа
    const response = {
      products: paginatedProducts,
      pagination: {
        total: products.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(products.length / limit)
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получение продукта по ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await readProductsData();
    const product = data.products.find(p => p.id === parseInt(id));

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получение списка категорий
app.get('/api/categories', async (req, res) => {
  try {
    const data = await readProductsData();
    const categories = [...new Set(data.products.map(product => product.category))];
    res.json(categories);
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 