// DOM Elements
const usernameInput = document.getElementById('username');
const searchBtn = document.getElementById('searchBtn');
const loadingEl = document.getElementById('loading');
const errorMessageEl = document.getElementById('errorMessage');
const errorTextEl = document.getElementById('errorText');
const userStatsContainer = document.getElementById('userStatsContainer');

// Store added users
let addedUsers = [];

// Load saved users from storage on startup
chrome.storage.local.get(['addedUsers'], (result) => {
    if (result.addedUsers && result.addedUsers.length > 0) {
        addedUsers = result.addedUsers;
        addedUsers.forEach(userData => {
            displayUserCard(userData);
        });
    }
});

// Event Listeners
searchBtn.addEventListener('click', handleSearch);
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

// Handle search button click
function handleSearch() {
    const username = usernameInput.value.trim();
    if (username) {
        // Check if user already added
        if (addedUsers.some(u => u.matchedUser.username.toLowerCase() === username.toLowerCase())) {
            showError('User already added!');
            setTimeout(() => hideError(), 2000);
            return;
        }
        fetchUserData(username);
    }
}

// Show/Hide UI elements
function showLoading() {
    loadingEl.classList.remove('hidden');
    errorMessageEl.classList.add('hidden');
    searchBtn.disabled = true;
    usernameInput.disabled = true;
}

function hideLoading() {
    loadingEl.classList.add('hidden');
    searchBtn.disabled = false;
    usernameInput.disabled = false;
}

function showError(message) {
    errorTextEl.textContent = message;
    errorMessageEl.classList.remove('hidden');
}

function hideError() {
    errorMessageEl.classList.add('hidden');
}

// Fetch user data from LeetCode GraphQL API
async function fetchUserData(username) {
    showLoading();

    try {
        const query = `
            query {
                matchedUser(username: "${username}") {
                    username
                    contributions { points }
                    profile {
                        realName
                        starRating
                        userAvatar
                        ranking
                    }
                    submitStats {
                        acSubmissionNum {
                            difficulty
                            count
                            submissions
                        }
                        totalSubmissionNum {
                            difficulty
                            count
                            submissions
                        }
                    }
                    badges { id icon }
                    activeBadge { id }
                }
                recentSubmissionList(username: "${username}", limit: 1) {
                    timestamp
                }
                userProfileUserQuestionProgressV2(userSlug: "${username}") {
                    numAcceptedQuestions {
                        count
                        difficulty
                    }
                }
            }
        `;

        const response = await fetch('https://leetcode.com/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: query })
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }

        const result = await response.json();

        if (!result.data || !result.data.matchedUser) {
            throw new Error('User not found');
        }

        // Add user to list
        addedUsers.push(result.data);
        
        // Save to storage
        chrome.storage.local.set({ addedUsers: addedUsers });

        // Display user card
        displayUserCard(result.data);

        // Clear input
        usernameInput.value = '';
        
        hideLoading();

    } catch (error) {
        console.error('Error fetching user data:', error);
        hideLoading();
        showError('Failed to fetch user data. Please check the username and try again.');
        setTimeout(() => hideError(), 3000);
    }
}

// Display user data card in the UI
function displayUserCard(data) {
    const user = data.matchedUser;
    const progress = data.userProfileUserQuestionProgressV2.numAcceptedQuestions;
    
    // Find total solved
    const allStats = user.submitStats.acSubmissionNum.find(stat => stat.difficulty === 'All');
    const total = allStats ? allStats.count : 0;

    // Get difficulty counts
    const easy = progress.find(p => p.difficulty === 'EASY')?.count || 0;
    const medium = progress.find(p => p.difficulty === 'MEDIUM')?.count || 0;
    const hard = progress.find(p => p.difficulty === 'HARD')?.count || 0;

    // Create user card
    const userCard = document.createElement('div');
    userCard.className = 'user-stats';
    userCard.innerHTML = `
        <div class="stats-card">
            <button class="remove-btn" data-username="${user.username}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <div class="profile-section">
                <img src="${user.profile.userAvatar}" alt="User Avatar" class="avatar" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22%3E%3Crect width=%2264%22 height=%2264%22 fill=%22%23ddd%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2224%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3E?%3C/text%3E%3C/svg%3E'">
                <div class="user-info">
                    <h2 class="user-name">${user.profile.realName || user.username}</h2>
                    <p class="username-text">@${user.username}</p>
                    
                    <div class="meta-info">
                        <div class="meta-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                                <path d="M4 22h16"></path>
                                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                            </svg>
                            <span>Rank: <strong>${user.profile.ranking.toLocaleString()}</strong></span>
                        </div>
                        <div class="meta-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                                <polyline points="16 7 22 7 22 13"></polyline>
                            </svg>
                            <span>${user.contributions.points} pts</span>
                        </div>
                    </div>

                    <div class="total-solved">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <circle cx="12" cy="12" r="6"></circle>
                            <circle cx="12" cy="12" r="2"></circle>
                        </svg>
                        <span class="total-text">${total} Questions Solved</span>
                    </div>

                    <div class="difficulty-badges">
                        <div class="badge easy-badge">
                            <span>Easy:</span>
                            <strong>${easy}</strong>
                        </div>
                        <div class="badge medium-badge">
                            <span>Medium:</span>
                            <strong>${medium}</strong>
                        </div>
                        <div class="badge hard-badge">
                            <span>Hard:</span>
                            <strong>${hard}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add remove button event listener
    const removeBtn = userCard.querySelector('.remove-btn');
    removeBtn.addEventListener('click', () => removeUser(user.username, userCard));

    // Add to container
    userStatsContainer.appendChild(userCard);
}

// Remove user from list
function removeUser(username, cardElement) {
    // Remove from array
    addedUsers = addedUsers.filter(u => u.matchedUser.username !== username);
    
    // Update storage
    chrome.storage.local.set({ addedUsers: addedUsers });
    
    // Remove card from DOM
    cardElement.remove();
}
