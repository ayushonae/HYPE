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
const exploreReadMore = document.getElementById("explore-read-more");
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

// Reset the Explore description whenever a different anime is opened.
function setExploreDescription(description) {
  // Convert AniList's HTML-formatted synopsis into plain text.
  const temporaryElement = document.createElement("div");
  temporaryElement.innerHTML = description || "No description available.";

  exploreDescription.textContent =
    temporaryElement.textContent || "No description available.";

  exploreDescription.classList.remove("expanded");
  exploreReadMore.textContent = "Read more ↓";
  exploreReadMore.setAttribute("aria-expanded", "false");

  // Show the control only when the description actually overflows.
  requestAnimationFrame(() => {
    const isOverflowing =
      exploreDescription.scrollHeight > exploreDescription.clientHeight + 1;

    exploreReadMore.hidden = !isOverflowing;
  });
}

// ==========================================
// WATCHLIST STORAGE
// ==========================================

let watchlist = JSON.parse(localStorage.getItem("hype-watchlist")) || [];

// Add default status and progress to older saved anime.
watchlist = watchlist.map((anime) => ({
  ...anime,
  status: anime.status || "Plan to Watch",
  progress: anime.progress || 0,
}));

// Save the updated data structure.
localStorage.setItem("hype-watchlist", JSON.stringify(watchlist));

// Currently selected Watchlist filter.
let currentWatchlistFilter = "All";

// ==========================================
// 2. ANILIST GRAPHQL QUERY
// ==========================================

// Randomly select a page between 1 and 50.
const randomPage = Math.floor(Math.random() * 50) + 1;

const query = `
    query {
        Page(page: ${randomPage}, perPage: 12) {
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
    // Check whether AniList returned GraphQL errors.
    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    const animeList = data.data.Page.media;

    // Hide loading message after successful response.
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

        setExploreDescription(item.description);

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
          ? "Remove from Watchlist"
          : "Add to Watchlist";

        addToWatchlistButton.disabled = false;

        exploreOverlay.classList.add("active");
      });

      // Add completed card to For You section.
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
    // Check for GraphQL errors.
    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    // Get the list of popular anime.
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

      // Portrait image for Explore and Watchlist.
      image: featuredData.coverImage.large,

      // Landscape image for Featured homepage.
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

    // Update rating.
    document.getElementById("featured-rating").textContent = anime[0].rating
      ? `⭐ ${(anime[0].rating / 10).toFixed(1)}`
      : "⭐ N/A";

    // Update episodes.
    document.getElementById("featured-episodes").textContent =
      anime[0].episodes;

    // Update genres.
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

  // Store currently selected anime.
  selectedAnime = {
    id: featured.id,
    title: featured.title,
    image: featured.image,
    rating: featured.rating,
    episodes: featured.episodes,
    genres: featured.genres,
  };

  // Update Explore panel.
  exploreTitle.textContent = featured.title;

  setExploreDescription(featured.description);

  exploreImage.src = featured.image || "";

  exploreImage.alt = featured.title;

  exploreRating.textContent = `⭐ ${
    featured.rating ? (featured.rating / 10).toFixed(1) : "N/A"
  }`;

  exploreEpisodes.textContent = featured.episodes;

  // Display genres.
  exploreGenres.innerHTML = "";

  featured.genres.forEach((genre) => {
    const genreTag = document.createElement("span");

    genreTag.textContent = genre;

    exploreGenres.appendChild(genreTag);
  });

  // Check Watchlist status.
  const alreadyAdded = watchlist.some((item) => item.id === selectedAnime.id);

  addToWatchlistButton.textContent = alreadyAdded
    ? "Remove from Watchlist"
    : "Add to Watchlist";

  addToWatchlistButton.disabled = false;

  // Open Explore panel.
  exploreOverlay.classList.add("active");
});

// ==========================================
// 10. CLOSE EXPLORE PANEL
// ==========================================

closeExplore.addEventListener("click", () => {
  exploreOverlay.classList.remove("active");
});

// Expand or collapse the anime description.
exploreReadMore.addEventListener("click", () => {
  const isExpanded = exploreDescription.classList.toggle("expanded");

  exploreReadMore.textContent = isExpanded ? "Show less ↑" : "Read more ↓";

  exploreReadMore.setAttribute("aria-expanded", String(isExpanded));
});

// ==========================================
// 11. ADD / REMOVE FROM WATCHLIST
// ==========================================

addToWatchlistButton.addEventListener("click", () => {
  if (!selectedAnime) return;

  // Check whether the anime already exists.
  const existingIndex = watchlist.findIndex(
    (item) => item.id === selectedAnime.id,
  );

  if (existingIndex !== -1) {
    // Remove anime from Watchlist.
    watchlist.splice(existingIndex, 1);

    addToWatchlistButton.textContent = "Add to Watchlist";
  } else {
    // Add anime to Watchlist.
    watchlist.push({
      ...selectedAnime,
      status: "Plan to Watch",
      progress: 0,
    });

    addToWatchlistButton.textContent = "Remove from Watchlist";
  }

  // Save updated Watchlist.
  localStorage.setItem("hype-watchlist", JSON.stringify(watchlist));

  // Refresh Watchlist UI.
  renderWatchlist();
});

// ==========================================
// 12. RENDER WATCHLIST
// ==========================================

function renderWatchlist() {
  // Keep the homepage section synchronized with the Watchlist.
  renderContinueWatching();

  watchlistContainer.innerHTML = "";

  const filteredWatchlist =
    currentWatchlistFilter === "All"
      ? watchlist
      : watchlist.filter((item) => item.status === currentWatchlistFilter);

  if (filteredWatchlist.length === 0) {
    emptyWatchlist.textContent =
      watchlist.length === 0
        ? "Your watchlist is empty. Explore something new!"
        : "No anime found in this category.";

    emptyWatchlist.classList.add("active");
    return;
  }

  emptyWatchlist.classList.remove("active");
  emptyWatchlist.textContent =
    "Your watchlist is empty. Explore something new!";

  filteredWatchlist.forEach((item) => {
    // Ensure older saved entries have the required properties.
    item.status = item.status || "Plan to Watch";
    item.progress = Number(item.progress) || 0;

    const totalEpisodes = parseInt(item.episodes, 10);

    const hasEpisodeCount = Number.isFinite(totalEpisodes) && totalEpisodes > 0;

    // Keep progress within the valid range when episode count is known.
    if (hasEpisodeCount) {
      item.progress = Math.min(item.progress, totalEpisodes);
    }

    const percentage = hasEpisodeCount
      ? Math.min((item.progress / totalEpisodes) * 100, 100)
      : 0;

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
            ⭐ ${item.rating ? (item.rating / 10).toFixed(1) : "N/A"}
          </span>

          <span>
            ${item.episodes ?? "Episodes TBA"}
          </span>
        </div>

        <label class="watch-status-label" for="status-${item.id}">
          Watch Status
        </label>

        <select
          class="watch-status-select"
          id="status-${item.id}"
          data-anime-id="${item.id}"
        >
          <option value="Plan to Watch" ${
            item.status === "Plan to Watch" ? "selected" : ""
          }>Plan to Watch</option>

          <option value="Watching" ${
            item.status === "Watching" ? "selected" : ""
          }>Watching</option>

          <option value="Completed" ${
            item.status === "Completed" ? "selected" : ""
          }>Completed</option>

          <option value="Dropped" ${
            item.status === "Dropped" ? "selected" : ""
          }>Dropped</option>
        </select>

        <div class="episode-progress">
          <div class="episode-progress-heading">
            <span>Episode Progress</span>
            <span class="episode-count">
              ${item.progress} / ${hasEpisodeCount ? totalEpisodes : "TBA"}
            </span>
          </div>

          <div class="progress-track">
            <div
              class="progress-fill"
              style="width: ${percentage}%"
            ></div>
          </div>

          <div class="episode-controls">
            <button
              class="episode-btn decrease-episode"
              type="button"
              aria-label="Decrease episode progress"
              ${item.progress <= 0 ? "disabled" : ""}
            >
              −
            </button>

            <span>Episodes watched</span>

            <button
              class="episode-btn increase-episode"
              type="button"
              aria-label="Increase episode progress"
              ${hasEpisodeCount && item.progress >= totalEpisodes ? "disabled" : ""}
            >
              +
            </button>
          </div>
        </div>

        <button class="remove-watchlist" type="button">
          <i data-lucide="trash-2"></i>
          <span>Remove</span>
        </button>
      </div>
    `;

    // ==========================================
    // UPDATE WATCH STATUS
    // ==========================================

    const statusSelect = card.querySelector(".watch-status-select");

    statusSelect.addEventListener("change", (event) => {
      item.status = event.target.value;

      localStorage.setItem("hype-watchlist", JSON.stringify(watchlist));

      // Re-render both sections. The card may disappear if it no longer
      // matches the currently selected filter.
      renderWatchlist();
    });

    // ==========================================
    // UPDATE EPISODE PROGRESS
    // ==========================================

    const updateProgress = (change) => {
      const newProgress = item.progress + change;

      if (newProgress < 0) return;

      if (hasEpisodeCount && newProgress > totalEpisodes) return;

      item.progress = newProgress;

      // Automatically update status when progress reaches the final episode.
      if (hasEpisodeCount && item.progress === totalEpisodes) {
        item.status = "Completed";
      } else if (item.status === "Completed") {
        item.status = "Watching";
      }

      localStorage.setItem("hype-watchlist", JSON.stringify(watchlist));

      renderWatchlist();
    };

    card.querySelector(".increase-episode").addEventListener("click", () => {
      updateProgress(1);
    });

    card.querySelector(".decrease-episode").addEventListener("click", () => {
      updateProgress(-1);
    });

    // ==========================================
    // REMOVE ANIME FROM WATCHLIST
    // ==========================================

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
  });

  // Recreate Lucide icons for newly rendered cards.
  if (window.lucide) {
    lucide.createIcons();
  }
}

// ==========================================
// WATCHLIST FILTER BUTTONS
// ==========================================

const watchlistFilters = document.querySelectorAll(".watchlist-filter");

watchlistFilters.forEach((button) => {
  button.addEventListener("click", () => {
    currentWatchlistFilter = button.dataset.filter;

    watchlistFilters.forEach((filter) => {
      filter.classList.remove("active");
    });

    button.classList.add("active");

    renderWatchlist();
  });
});

// ==========================================
// CONTINUE WATCHING SECTION
// ==========================================

function renderContinueWatching() {
  const continueContainer = document.getElementById("continue-watching");
  const continueEmpty = document.getElementById("continue-empty");

  // Safely exit if the matching HTML elements have not been added yet.
  if (!continueContainer || !continueEmpty) return;

  const watchingAnime = watchlist.filter((item) => item.status === "Watching");

  continueContainer.innerHTML = "";

  if (watchingAnime.length === 0) {
    continueEmpty.style.display = "block";
    return;
  }

  continueEmpty.style.display = "none";

  watchingAnime.forEach((item) => {
    const totalEpisodes = parseInt(item.episodes, 10);

    const hasEpisodeCount = Number.isFinite(totalEpisodes) && totalEpisodes > 0;

    const progress = Number(item.progress) || 0;

    const percentage = hasEpisodeCount
      ? Math.min((progress / totalEpisodes) * 100, 100)
      : 0;

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

        <div class="continue-progress-info">
          <span>Episode ${progress}</span>
          <span>
            ${hasEpisodeCount ? `of ${totalEpisodes}` : "of TBA"}
          </span>
        </div>

        <div class="progress-track">
          <div
            class="progress-fill"
            style="width: ${percentage}%"
          ></div>
        </div>
      </div>
    `;

    continueContainer.appendChild(card);
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

// Initial Watchlist rendering.
renderWatchlist();

// ==========================================
// 13. PAGE NAVIGATION
// ==========================================

const homeView = document.getElementById("home-view");

const watchlistView = document.getElementById("watchlist");

const homeLink = document.getElementById("home-link");

const watchlistLink = document.getElementById("watchlist-link");

function showView(view) {
  // Hide every page.
  document.querySelectorAll(".page-view").forEach((page) => {
    page.classList.remove("active");
  });

  // Show selected page.
  view.classList.add("active");

  // Scroll to the top.
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

// Open Home.
homeLink.addEventListener("click", (event) => {
  event.preventDefault();

  showView(homeView);
});

// Open Watchlist.
watchlistLink.addEventListener("click", (event) => {
  event.preventDefault();

  showView(watchlistView);

  renderWatchlist();
});

// Show Home initially.
showView(homeView);

// ==========================================
// 14. FOR YOU CAROUSEL NAVIGATION
// ==========================================

const forYouCarousel = document.getElementById("for-you");

const previousButton = document.getElementById("for-you-prev");

const nextButton = document.getElementById("for-you-next");

// Move carousel left.
previousButton.addEventListener("click", () => {
  forYouCarousel.scrollBy({
    left: -forYouCarousel.clientWidth * 0.8,
    behavior: "smooth",
  });
});

// Move carousel right.
nextButton.addEventListener("click", () => {
  forYouCarousel.scrollBy({
    left: forYouCarousel.clientWidth * 0.8,
    behavior: "smooth",
  });
});

// Update arrow states.
function updateCarouselButtons() {
  previousButton.disabled = forYouCarousel.scrollLeft <= 0;

  nextButton.disabled =
    forYouCarousel.scrollLeft + forYouCarousel.clientWidth >=
    forYouCarousel.scrollWidth - 1;
}

// Listen for scrolling.
forYouCarousel.addEventListener("scroll", updateCarouselButtons);

// Initial button state.
updateCarouselButtons();

// Recalculate arrow states when the window is resized.
window.addEventListener("resize", updateCarouselButtons);
