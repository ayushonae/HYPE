console.log("HYPE JS is working");

// ==========================================
// 1. GET HTML ELEMENTS
// ==========================================

const container = document.getElementById("for-you");
const forYouStatus = document.getElementById("for-you-status");

const exploreOverlay = document.getElementById("explore-overlay");
const exploreImage = document.getElementById("explore-image");
const exploreTitle = document.getElementById("explore-title");
const exploreDescription = document.getElementById("explore-description");
const exploreRating = document.getElementById("explore-rating");
const exploreEpisodes = document.getElementById("explore-episodes");
const exploreGenres = document.getElementById("explore-genres");

const exploreButton = document.querySelector(".featured button");
const closeExplore = document.getElementById("close-explore");
const addToWatchlistButton = document.querySelector(".primary-action");

const watchlistContainer = document.getElementById("watchlist-container");
const emptyWatchlist = document.getElementById("empty-watchlist");

const watchlistToast = document.getElementById("watchlist-toast");
const undoButton = document.getElementById("undo-remove");

const featuredTitle = document.getElementById("featured-title");
const featuredDescription = document.getElementById("featured-description");
const featuredImage = document.getElementById("featured-image");

let removedAnime = null;
let removedIndex = -1;
let toastTimeout;

let selectedAnime = null;

// ==========================================
// WATCHLIST STORAGE
// ==========================================

let watchlist = JSON.parse(localStorage.getItem("hype-watchlist")) || [];

// ==========================================
// 2. ANILIST GRAPHQL QUERY
// ==========================================

const query = `
    query {
        Page(perPage: 12) {
            media(type: ANIME, sort: POPULARITY_DESC) {
                id
                title {
                    romaji
                }
                coverImage {
                    large
                }
                description
                episodes
                averageScore
                genres
            }
        }
    }
`;

// ==========================================
// 3. FETCH ANIME DATA FROM ANILIST
// ==========================================

fetch("https://graphql.anilist.co", {
  method: "POST",

  headers: {
    "Content-Type": "application/json",
  },

  body: JSON.stringify({
    query: query,
  }),
})
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    return response.json();
  })

  .then((data) => {
    // Check whether AniList returned GraphQL errors
    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    const animeList = data.data.Page.media;

    // Hide loading message after successful response
    forYouStatus.style.display = "none";

    // ==========================================
    // 4. CREATE ANIME CARDS
    // ==========================================

    animeList.forEach((item) => {
      const card = document.createElement("article");

      card.classList.add("content-card");

      card.innerHTML = `
            <div class="poster">
                <img
                    src="${item.coverImage.large}"
                    alt="${item.title.romaji}"
                >
            </div>

            <div class="card-info">
                <h3>${item.title.romaji}</h3>

                <div class="anime-meta">
                    <span>
                        ⭐ ${
                          item.averageScore
                            ? (item.averageScore / 10).toFixed(1)
                            : "N/A"
                        }
                    </span>

                    <span>
                        ${item.episodes ?? "Episodes TBA"} Episodes
                    </span>
                </div>
            </div>
        `;

      // ==========================================
      // 5. OPEN EXPLORE PANEL WHEN CARD IS CLICKED
      // ==========================================

      card.addEventListener("click", () => {
        selectedAnime = {
          id: item.id,
          title: item.title.romaji,
          image: item.coverImage.large,
          rating: item.averageScore,
          episodes: item.episodes,
          genres: item.genres,
        };

        exploreImage.src = item.coverImage.large;
        exploreImage.alt = item.title.romaji;

        exploreTitle.textContent = item.title.romaji;

        exploreDescription.innerHTML =
          item.description || "No description available.";

        exploreRating.textContent = `⭐ ${
          item.averageScore ? (item.averageScore / 10).toFixed(1) : "N/A"
        }`;

        exploreEpisodes.textContent = item.episodes ?? "Episodes TBA";

        exploreGenres.innerHTML = "";

        item.genres.forEach((genre) => {
          const genreTag = document.createElement("span");

          genreTag.textContent = genre;

          exploreGenres.appendChild(genreTag);
        });

        const alreadyAdded = watchlist.some(
          (anime) => anime.id === selectedAnime.id,
        );

        addToWatchlistButton.textContent = alreadyAdded
          ? "Added to Watchlist"
          : "Add to Watchlist";

        addToWatchlistButton.disabled = alreadyAdded;

        exploreOverlay.classList.add("active");
      });

      // Add completed card to For You section
      container.appendChild(card);
    });
    updateCarouselButtons();
  })

  .catch((error) => {
    console.error("AniList API Error:", error);

    forYouStatus.textContent =
      "Couldn't load recommendations. Please try again.";
  });

// ==========================================
// 6. TEMPORARY FEATURED ANIME DATA
// ==========================================

const anime = [
  {
    id: 21,
    title: "One Piece",
    image: null,
    episode: 1120,
    rating: 91,
    progress: 65,

    description:
      "The journey of Monkey D. Luffy and his crew as they search for the legendary One Piece.",

    episodes: "1120+ Episodes",

    genres: ["Action", "Adventure"],
  },

  {
    title: "Jujutsu Kaisen",
    episode: 48,
    rating: 88,
    progress: 40,

    description:
      "A world where cursed energy and supernatural battles shape the lives of powerful sorcerers.",

    episodes: "48 Episodes",

    genres: ["Action", "Fantasy"],
  },

  {
    title: "Attack on Titan",
    episode: 87,
    rating: 90,
    progress: 82,

    description:
      "Humanity fights for survival against mysterious giants beyond the walls.",

    episodes: "87 Episodes",

    genres: ["Action", "Drama"],
  },
];

// ==========================================
// 7. FETCH DYNAMIC FEATURED ANIME
// ==========================================

fetch("https://graphql.anilist.co", {
  method: "POST",

  headers: {
    "Content-Type": "application/json",
  },

  body: JSON.stringify({
    query: `
            query {
                Page(perPage: 10) {
                    media(type: ANIME, sort: POPULARITY_DESC) {
                        id
                        title {
                            romaji
                        }
                        coverImage {
                            large
                        }
                        bannerImage
                        description
                        episodes
                        averageScore
                        genres
                    }
                }
            }
        `,
  }),
})
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    return response.json();
  })

  .then((data) => {
    // Check for GraphQL errors
    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    // Get the list of popular anime
    const featuredAnimeList = data.data.Page.media;

    if (featuredAnimeList.length === 0) {
      throw new Error("No featured anime found.");
    }

    // ==========================================
    // SELECT A RANDOM ANIME
    // ==========================================

    const randomIndex = Math.floor(Math.random() * featuredAnimeList.length);

    const featuredData = featuredAnimeList[randomIndex];

    // ==========================================
    // UPDATE FEATURED ANIME DATA
    // ==========================================

    anime[0] = {
      id: featuredData.id,
      title: featuredData.title.romaji,

      // Portrait image for Explore and Watchlist
      image: featuredData.coverImage.large,
      // Landscape image for Featured homepage
      bannerImage: featuredData.bannerImage || featuredData.coverImage.large,

      episode: 0,

      rating: featuredData.averageScore,

      progress: 0,

      description: featuredData.description
        ? featuredData.description.replace(/<[^>]*>/g, "")
        : "No description available.",

      episodes: featuredData.episodes
        ? `${featuredData.episodes} Episodes`
        : "Episodes TBA",

      genres: featuredData.genres,
    };

    // ==========================================
    // UPDATE FEATURED HOMEPAGE CONTENT
    // ==========================================

    featuredTitle.textContent = anime[0].title;

    featuredDescription.textContent = anime[0].description;

    featuredImage.src = anime[0].bannerImage;
    featuredImage.alt = anime[0].title;

    // Update rating
    document.getElementById("featured-rating").textContent = anime[0].rating
      ? `⭐ ${(anime[0].rating / 10).toFixed(1)}`
      : "⭐ N/A";

    // Update episodes
    document.getElementById("featured-episodes").textContent =
      anime[0].episodes;

    // Update genres
    const featuredGenres = document.getElementById("featured-genres");

    featuredGenres.innerHTML = "";

    anime[0].genres.forEach((genre) => {
      const genreTag = document.createElement("span");

      genreTag.textContent = genre;

      featuredGenres.appendChild(genreTag);
    });

    // ==========================================
    // SYNCHRONIZE SELECTED ANIME
    // ==========================================

    if (selectedAnime?.id === featuredData.id) {
      selectedAnime.image = featuredData.coverImage.large;

      exploreImage.src = featuredData.coverImage.large;
    }

    // ==========================================
    // SYNCHRONIZE WATCHLIST POSTER
    // ==========================================

    const watchlistAnime = watchlist.find(
      (item) => item.id === featuredData.id,
    );

    if (watchlistAnime) {
      watchlistAnime.image = featuredData.coverImage.large;

      localStorage.setItem("hype-watchlist", JSON.stringify(watchlist));

      renderWatchlist();
    }
  })

  .catch((error) => {
    console.error("Featured Anime API Error:", error);
  });

// ==========================================
// 8. FEATURED SECTION
// ==========================================

// Wait for AniList to provide the featured anime.
// Initial loading text is already present in HTML.

// ==========================================
// 9. FEATURED EXPLORE BUTTON
// ==========================================

exploreButton.addEventListener("click", () => {
  const featured = anime[0];

  // Store currently selected anime
  selectedAnime = {
    id: featured.id,
    title: featured.title,
    image: featured.image,
    rating: featured.rating,
    episodes: featured.episodes,
    genres: featured.genres,
  };

  // Update Explore panel
  exploreTitle.textContent = featured.title;

  exploreDescription.textContent = featured.description;

  exploreImage.src = featured.image || "";

  exploreImage.alt = featured.title;

  exploreRating.textContent = `⭐ ${
    featured.rating ? (featured.rating / 10).toFixed(1) : "N/A"
  }`;

  exploreEpisodes.textContent = featured.episodes;

  // Display genres
  exploreGenres.innerHTML = "";

  featured.genres.forEach((genre) => {
    const genreTag = document.createElement("span");

    genreTag.textContent = genre;

    exploreGenres.appendChild(genreTag);
  });

  // Check Watchlist status
  const alreadyAdded = watchlist.some((item) => item.id === selectedAnime.id);

  addToWatchlistButton.textContent = alreadyAdded
    ? "Added to Watchlist"
    : "Add to Watchlist";

  addToWatchlistButton.disabled = alreadyAdded;

  // Open Explore panel
  exploreOverlay.classList.add("active");
});

// ==========================================
// 10. CLOSE EXPLORE PANEL
// ==========================================

closeExplore.addEventListener("click", () => {
  exploreOverlay.classList.remove("active");
});

// ==========================================
// 11. ADD TO WATCHLIST
// ==========================================

addToWatchlistButton.addEventListener("click", () => {
  if (!selectedAnime) return;

  const alreadyAdded = watchlist.some((item) => item.id === selectedAnime.id);

  if (alreadyAdded) return;

  watchlist.push(selectedAnime);

  localStorage.setItem("hype-watchlist", JSON.stringify(watchlist));

  addToWatchlistButton.textContent = "Added to Watchlist";

  addToWatchlistButton.disabled = true;
});

// ==========================================
// 12. RENDER WATCHLIST
// ==========================================

function renderWatchlist() {
  watchlistContainer.innerHTML = "";

  if (watchlist.length === 0) {
    emptyWatchlist.classList.add("active");

    return;
  }

  emptyWatchlist.classList.remove("active");

  watchlist.forEach((item) => {
    const card = document.createElement("article");

    card.classList.add("content-card");

    card.innerHTML = `
            <div class="poster">
                <img
                    src="${item.image || ""}"
                    alt="${item.title}"
                >
            </div>

            <div class="card-info">
                <h3>${item.title}</h3>

                <div class="anime-meta">
                    <span>
                        ⭐ ${
                          item.rating ? (item.rating / 10).toFixed(1) : "N/A"
                        }
                    </span>

                    <span>
                        ${item.episodes ?? "Episodes TBA"}
                    </span>
                </div>

                <button class="remove-watchlist" type="button">
                    <i data-lucide="trash-2"></i>
                    <span>Remove</span>
                </button>
            </div>
        `;

    const removeButton = card.querySelector(".remove-watchlist");

    // ==========================================
    // REMOVE ANIME FROM WATCHLIST
    // ==========================================

    removeButton.addEventListener("click", () => {
      removedIndex = watchlist.findIndex((anime) => anime.id === item.id);

      if (removedIndex === -1) return;

      removedAnime = watchlist[removedIndex];

      watchlist.splice(removedIndex, 1);

      localStorage.setItem("hype-watchlist", JSON.stringify(watchlist));

      renderWatchlist();

      watchlistToast.classList.add("active");

      clearTimeout(toastTimeout);

      toastTimeout = setTimeout(() => {
        watchlistToast.classList.remove("active");

        removedAnime = null;

        removedIndex = -1;
      }, 5000);
    });

    watchlistContainer.appendChild(card);

    lucide.createIcons();
  });
}

// ==========================================
// UNDO WATCHLIST REMOVAL
// ==========================================

undoButton.addEventListener("click", () => {
  if (!removedAnime) return;

  watchlist.splice(removedIndex, 0, removedAnime);

  localStorage.setItem("hype-watchlist", JSON.stringify(watchlist));

  renderWatchlist();

  watchlistToast.classList.remove("active");

  clearTimeout(toastTimeout);

  removedAnime = null;

  removedIndex = -1;
});

// Initial Watchlist rendering
renderWatchlist();

// ==========================================
// 13. PAGE NAVIGATION
// ==========================================

const homeView = document.getElementById("home-view");

const watchlistView = document.getElementById("watchlist");

const homeLink = document.getElementById("home-link");

const watchlistLink = document.getElementById("watchlist-link");

function showView(view) {
  // Hide every page
  document.querySelectorAll(".page-view").forEach((page) => {
    page.classList.remove("active");
  });

  // Show selected page
  view.classList.add("active");

  // Scroll to the top
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

// Open Home
homeLink.addEventListener("click", (event) => {
  event.preventDefault();

  showView(homeView);
});

// Open Watchlist
watchlistLink.addEventListener("click", (event) => {
  event.preventDefault();

  showView(watchlistView);

  renderWatchlist();
});

// Show Home initially
showView(homeView);

// ==========================================
// 14. FOR YOU CAROUSEL NAVIGATION
// ==========================================

const forYouCarousel = document.getElementById("for-you");

const previousButton = document.getElementById("for-you-prev");

const nextButton = document.getElementById("for-you-next");

// Move carousel left
previousButton.addEventListener("click", () => {
  forYouCarousel.scrollBy({
    left: -forYouCarousel.clientWidth * 0.8,
    behavior: "smooth",
  });
});

// Move carousel right
nextButton.addEventListener("click", () => {
  forYouCarousel.scrollBy({
    left: forYouCarousel.clientWidth * 0.8,
    behavior: "smooth",
  });
});

// Update arrow states
function updateCarouselButtons() {
  previousButton.disabled = forYouCarousel.scrollLeft <= 0;

  nextButton.disabled =
    forYouCarousel.scrollLeft + forYouCarousel.clientWidth >=
    forYouCarousel.scrollWidth - 1;
}

// Listen for scrolling
forYouCarousel.addEventListener("scroll", updateCarouselButtons);

// Initial button state
updateCarouselButtons();
// Recalculate arrow states when the window is resized
window.addEventListener("resize", updateCarouselButtons);
