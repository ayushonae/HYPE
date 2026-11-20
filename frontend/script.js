console.log("HYPE JS is working");

// ==========================================
// 1. GET HTML ELEMENTS
// ==========================================

const container = document.getElementById("for-you");

const exploreOverlay = document.getElementById("explore-overlay");
const exploreImage = document.getElementById("explore-image");
const exploreTitle = document.getElementById("explore-title");
const exploreDescription = document.getElementById("explore-description");
const exploreRating = document.getElementById("explore-rating");
const exploreEpisodes = document.getElementById("explore-episodes");
const exploreGenre1 = document.getElementById("explore-genre-1");
const exploreGenre2 = document.getElementById("explore-genre-2");
const exploreGenres = document.getElementById("explore-genres");

const exploreButton = document.querySelector(".featured button");
const closeExplore = document.getElementById("close-explore");
const addToWatchlistButton = document.querySelector(".primary-action");
const watchlistContainer = document.getElementById("watchlist-container");

const emptyWatchlist = document.getElementById("empty-watchlist");
const watchlistToast = document.getElementById("watchlist-toast");

const undoButton = document.getElementById("undo-remove");

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
        Page(perPage: 3) {
            media(type: ANIME) {
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
          (item) => item.id === selectedAnime.id,
        );

        addToWatchlistButton.textContent = alreadyAdded
          ? "Added to Watchlist"
          : "Add to Watchlist";

        addToWatchlistButton.disabled = alreadyAdded;

        exploreOverlay.classList.add("active");
      });

      // Add the completed card to the For You section
      container.appendChild(card);
    });
  })

  .catch((error) => {
    console.error("AniList API Error:", error);
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
    rating: 9.1,
    progress: 65,
    description:
      "The journey of Monkey D. Luffy and his crew as they search for the legendary One Piece.",
    episodes: "1120+ Episodes",
    genres: ["Action", "Adventure"],
  },

  {
    title: "Jujutsu Kaisen",
    episode: 48,
    rating: 8.8,
    progress: 40,
    description:
      "A world where cursed energy and supernatural battles shape the lives of powerful sorcerers.",
    episodes: "48 Episodes",
    genres: ["Action", "Fantasy"],
  },

  {
    title: "Attack on Titan",
    episode: 87,
    rating: 9.0,
    progress: 82,
    description:
      "Humanity fights for survival against mysterious giants beyond the walls.",
    episodes: "87 Episodes",
    genres: ["Action", "Drama"],
  },
];

// ==========================================
// 7. FETCH FEATURED ANIME POSTER
// ==========================================

fetch("https://graphql.anilist.co", {
  method: "POST",

  headers: {
    "Content-Type": "application/json",
  },

  body: JSON.stringify({
    query: `
            query {
                Media(id: 21, type: ANIME) {
                    id
                    title {
                        romaji
                    }
                    coverImage {
                        large
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
    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    const featuredData = data.data.Media;

    anime[0].image = featuredData.coverImage.large;

    // Update the currently selected anime
    if (selectedAnime?.id === featuredData.id) {
      selectedAnime.image = featuredData.coverImage.large;
      exploreImage.src = featuredData.coverImage.large;
    }

    // Update the saved Watchlist entry
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

const featuredTitle = document.getElementById("featured-title");
const featuredDescription = document.getElementById("featured-description");

const featured = anime[0];

featuredTitle.textContent = featured.title;

featuredDescription.textContent = featured.description;

// ==========================================
// 9. FEATURED EXPLORE BUTTON
// ==========================================

exploreButton.addEventListener("click", () => {
  const featured = anime[0];

  // Store the currently selected anime
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

  exploreRating.textContent = `⭐ ${featured.rating}`;

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
// RENDER WATCHLIST
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
                    <span>⭐ ${
                      item.rating ? (item.rating / 10).toFixed(1) : "N/A"
                    }</span>

                    <span>${item.episodes ?? "Episodes TBA"}</span>
                </div>

                <button class="remove-watchlist" type="button">
    <i data-lucide="trash-2"></i>
    <span>Remove</span>
</button>
            </div>
        `;

    const removeButton = card.querySelector(".remove-watchlist");

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

renderWatchlist();

/// ==========================================
// PAGE NAVIGATION
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

  // Show the selected page
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
