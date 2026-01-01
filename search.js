// Shop Search Functionality - Local Version
// Based on original freetree.io search functionality

(function() {
    'use strict';

    var queryValueLocale = '';
    var queryValue = '';
    var currentSearchString = '';
    var shopLoadedCount = 0;
    var resultCount = 70;
    var isOnPageSearch = false;

    // Detect user's locale
    var detectedLang = Intl.DateTimeFormat().resolvedOptions().locale;
    detectedLang = detectedLang.toLowerCase();

    if (detectedLang.includes('us')) {
        queryValueLocale = 'US';
    } else if (detectedLang.includes('gb')) {
        queryValueLocale = 'GB';
    } else if (detectedLang.includes('fr')) {
        queryValueLocale = 'FR';
    } else if (detectedLang.includes('de')) {
        queryValueLocale = 'DE';
    } else {
        queryValueLocale = 'US';
    }

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        initializeSearch();
    });

    function initializeSearch() {
        var searchInput = document.getElementById('search');
        var countrySelect = document.getElementById('search_country');
        var loadMoreBtn = document.getElementById('loadMoreShops');

        // Set initial country
        countrySelect.value = queryValueLocale;

        // Initial shop load
        searchShops(true);

        // Search on keyup with debounce
        var debounceTimer;
        searchInput.addEventListener('keyup', function(e) {
            var searchString = this.value;

            if (currentSearchString !== searchString && searchString.length >= 3) {
                currentSearchString = searchString;
                isOnPageSearch = true;

                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(function() {
                    searchShops(true);
                }, 500);
            } else if (searchString.length < 3 && currentSearchString !== '') {
                currentSearchString = '';
                isOnPageSearch = true;
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(function() {
                    searchShops(true);
                }, 500);
            }
        });

        // Search on country change
        countrySelect.addEventListener('change', function(e) {
            isOnPageSearch = true;
            searchShops(true);
        });

        // Load more shops
        loadMoreBtn.addEventListener('click', function(e) {
            e.preventDefault();
            var container = document.getElementById('containerLoadMoreShops');
            container.style.display = 'none';
            searchShops(false);
        });
    }

    // Show loading indicator
    function showLoadIndicator() {
        document.getElementById('loadIndicator').style.display = 'block';
    }

    // Hide loading indicator
    function hideLoadIndicator() {
        document.getElementById('loadIndicator').style.display = 'none';
    }

    // Main search function
    function searchShops(clearShops) {
        var searchInput = document.getElementById('search');
        var countrySelect = document.getElementById('search_country');
        
        if (isOnPageSearch) {
            queryValue = searchInput.value;
            queryValueLocale = countrySelect.value;
        }

        // Hide load more button
        document.getElementById('containerLoadMoreShops').style.display = 'none';

        // Clear shops list if needed
        if (clearShops) {
            document.getElementById('containerShopResultList').innerHTML = '';
            shopLoadedCount = 0;
        }

        showLoadIndicator();

        // Simulate async behavior (like original AJAX call)
        setTimeout(function() {
            var filteredShops = filterShops(queryValue, queryValueLocale);
            var response = {
                resultCount: Math.min(resultCount, filteredShops.length - shopLoadedCount),
                results: filteredShops.slice(shopLoadedCount, shopLoadedCount + resultCount)
            };
            displayShopResults(response, queryValue, clearShops, filteredShops.length);
        }, 200);

        return false;
    }

    // Filter shops based on query and locale
    function filterShops(query, locale) {
        return shopsData.filter(function(shop) {
            // Country filter
            var countryMatch = locale === 'ALL' || 
                              shop.countries.indexOf(locale) !== -1 || 
                              shop.countries.indexOf('ALL') !== -1;

            // Query filter
            var queryMatch = true;
            if (query && query.length >= 1) {
                var lowerQuery = query.toLowerCase();
                queryMatch = shop.shopName.toLowerCase().indexOf(lowerQuery) !== -1 ||
                            shop.domain.toLowerCase().indexOf(lowerQuery) !== -1 ||
                            shop.description.toLowerCase().indexOf(lowerQuery) !== -1;
            }

            return countryMatch && queryMatch;
        });
    }

    // Display shop results
    function displayShopResults(response, queryValue, clearShops, totalCount) {
        if (clearShops && response.resultCount === 0) {
            document.getElementById('containerShopResultList').innerHTML = 
                '<h3 style="color:#fff;text-align: center;">Oops! Unfortunately we don\'t have this shop yet!</h3>' +
                '<br><h4 style="color:#fff;text-align: center;">But we are working on it.</h4>' +
                '<br><h4 style="color:#fff;text-align: center;">☕</h4>' +
                '<br><h4 style="color:#fff;text-align: center;">Please search again, we have a lot of shops to plant trees!</h4>';
            hideLoadIndicator();
            return;
        }

        // Create or get the list
        var container = document.getElementById('containerShopResultList');
        if (clearShops) {
            container.innerHTML = '<ul id="shopResultList"></ul>';
        }
        hideLoadIndicator();

        var shopList = document.getElementById('shopResultList');

        // Build result list
        for (var i = 0; i < response.results.length; i++) {
            var shop = response.results[i];
            var shopResultId = i + shopLoadedCount;

            var liHtml = '';
            
            liHtml += '<li class="shop" shop-id="' + shopResultId + '">';
            liHtml += '<a href="https://' + shop.domain + '" target="_blank" rel="noopener noreferrer">';
            liHtml += '<div style="display: table; width: 100%;"><div class="domain">' + shop.domain + '</div></div>';

            if (shop.imageUrl && shop.imageUrl.indexOf('no_image') === -1) {
                liHtml += '<div class="shop-logo"><img src="' + shop.imageUrl + '" alt="' + shop.shopName + '" onerror="this.parentElement.className=\'heading\';this.parentElement.innerHTML=\'' + shop.shopName + '\';"></div>';
            } else {
                liHtml += '<div class="heading">' + shop.shopName + '</div>';
            }

            var shortDesc = shop.description.length > 1 ? shop.description.substr(0, 140) + '...' : '';
            liHtml += '<div class="description" style="display: none;">' + shortDesc + '</div>';
            liHtml += '</a>';
            liHtml += '</li>';
            liHtml += '<li id="placeholder' + shopResultId + '" class="shopPlaceholder"></li>';

            shopList.innerHTML += liHtml;
        }

        // Update count and show load more if needed
        shopLoadedCount += response.resultCount;

        if (shopLoadedCount < totalCount) {
            document.getElementById('containerLoadMoreShops').style.display = 'block';
        }

        // Initialize hover behavior
        initShopBehaviour();
    }

    // Initialize shop hover behavior
    function initShopBehaviour() {
        var shops = document.querySelectorAll('ul#shopResultList > li.shop');
        
        shops.forEach(function(shop) {
            shop.addEventListener('mouseenter', function() {
                this.style.zIndex = '5';
            });

            shop.addEventListener('mouseleave', function() {
                this.style.zIndex = '1';
            });
        });
    }

})();
