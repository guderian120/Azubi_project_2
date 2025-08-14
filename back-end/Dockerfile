FROM php:8.3-fpm
# Install dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_mysql mbstring exif pcntl bcmath gd zip

# Install composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

RUN composer config -g repo.packagist composer https://mirrors.aliyun.com/composer
# Copy composer files and install
COPY composer.json composer.lock ./
RUN composer install --no-scripts --no-autoloader

COPY .env.example .env
# Copy all files
COPY . .

# Generate key and optimize
RUN composer dump-autoload --optimize && \
    php artisan key:generate

EXPOSE 5000

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=5000"]