// Initial Data
const initialUserData = {
    username: 'Rutika',
    currentLevel: 1,
    currentXP: 0,
    nextLevelXP: 100,
    allRounderStatPoints: 0,
    stats: {
        strength: 1.011,
        intelligence: 1.015,
        charm: 1.030,
        agility: 1.049,
        stamina: 1.01,
        endurance: 1.1,
        luck: 1.1
    }
};

const initialQuests = [
    {
        name: 'Add Your First Quest',
        type: 'Special',
        description: 'Try To Add Any Quest, Its The Beginning Of New Journey, Familiraize Your Self With System...',
        grade: 'G-',
        xpReward: 20,
        statReward: { name: 'Intelligence', count: 1 },
        startTime: new Date().toISOString(),
        deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        deadlineDuration: { hours: 23, minutes: 30 }, // Add this field
        status: 'Ongoing',
        isFailed: false // Add this field
    }
];


// Utility Functions
function loadUserData() {
    return JSON.parse(localStorage.getItem('userData')) || initialUserData;
}

function saveUserData(userData) {
    localStorage.setItem('userData', JSON.stringify(userData));
}

function loadQuests() {
    return JSON.parse(localStorage.getItem('quests')) || initialQuests;
}

function saveQuests(quests) {
    localStorage.setItem('quests', JSON.stringify(quests));
}

function formatDateToLocal(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString(); // This will format the date according to your local timezone
}

// Export quests to a text file
function exportQuestsToText() {
    const quests = loadQuests();
    let textContent = "";

    quests.forEach(quest => {
        textContent += `Name: ${quest.name}\n`;
        textContent += `Type: ${quest.type}\n`;
        textContent += `Description: ${quest.description}\n`;
        textContent += `Grade: ${quest.grade}\n`;
        textContent += `XP Reward: ${quest.xpReward}\n`;
        textContent += `Stat Reward: ${quest.statReward.name} ${quest.statReward.count}\n`;
        textContent += `Status: ${quest.status}\n`;
        textContent += `Start Time: ${formatDateToLocal(quest.startTime)}\n`;
        textContent += `Deadline: ${formatDateToLocal(quest.deadline)}\n`;
        textContent += "----------------------\n";
    });

    const blob = new Blob([textContent], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "quests.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Event Listener for export button
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('export-quests-button').addEventListener('click', exportQuestsToText);
    document.getElementById('import-quests-button').addEventListener('click', function() {
        document.getElementById('file-input').click();
    });
    document.getElementById('file-input').addEventListener('change', function(event) {
        const file = event.target.files[0];
        importQuestsFromText(file);
    });

    resetDailyQuests();
    displayQuests(); // Initial display of quests
});

// Import quests from a text file
function importQuestsFromText(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const textData = event.target.result;
        const quests = [];
        const questEntries = textData.split('----------------------\n');

        questEntries.forEach(entry => {
            const lines = entry.split('\n').filter(line => line.trim() !== '');
            if (lines.length < 9) return; // Skip incomplete entries

            try {
                const name = lines[0].split(': ')[1];
                const type = lines[1].split(': ')[1];
                const description = lines.slice(2, lines.length - 6).map(line => line.split(': ')[1] || line).join('\n');
                const grade = lines[lines.length - 6].split(': ')[1];
                const xpReward = parseInt(lines[lines.length - 5].split(': ')[1], 10);
                const statRewardParts = lines[lines.length - 4].split(': ')[1].split(' ');
                const statReward = {
                    name: statRewardParts[0],
                    count: parseInt(statRewardParts[1], 10)
                };
                const status = lines[lines.length - 3].split(': ')[1];
                const startTime = new Date(lines[lines.length - 2].split(': ')[1]).toISOString();
                const deadline = new Date(lines[lines.length - 1].split(': ')[1]).toISOString();

                if (name && type && description && grade && !isNaN(xpReward) && statReward.name && !isNaN(statReward.count) && status && startTime && deadline) {
                    const quest = {
                        name,
                        type,
                        description,
                        grade,
                        xpReward,
                        statReward,
                        status,
                        startTime,
                        deadline
                    };
                    quests.push(quest);
                } else {
                    console.error('Incomplete quest entry found and skipped:', entry);
                }
            } catch (error) {
                console.error('Error parsing quest entry:', error);
            }
        });

        saveQuests(quests);
        showNotification('Quests imported successfully!');
        displayQuests(); // Refresh the quests display
    };
    reader.readAsText(file);
}



// Function to add a new quest
const form = document.getElementById('add-quest-form');
if (form) {
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        const questNameElem = document.getElementById('quest-name');
        const questTypeElem = document.getElementById('quest-type');
        const questDescriptionElem = document.getElementById('quest-description');
        const questGradeElem = document.getElementById('quest-grade');
        const questXPElem = document.getElementById('quest-xp');
        const questStatNameElem = document.getElementById('quest-stat-name');
        const questStatCountElem = document.getElementById('quest-stat-count');
        const questDailyElem = document.getElementById('quest-daily');
        const increaseRateElem = document.getElementById('increase-rate');
        // Collecting deadline
        const deadlineValue = parseInt(document.getElementById('quest-deadline-value').value, 10) || 0;
        const deadlineUnit = document.getElementById('quest-deadline-unit').value;
        const deadline = calculateDeadline(deadlineValue, deadlineUnit);

        const newQuest = {
            name: questNameElem.value,
            type: questTypeElem.value,
            description: questDescriptionElem.value,
            grade: questGradeElem.value,
            xpReward: parseInt(questXPElem.value, 10),
            statReward: {
                name: questStatNameElem.value,
                count: parseFloat(questStatCountElem.value)
            },
            isDaily: questDailyElem.checked,
            increaseRate: parseFloat(increaseRateElem.value) || 0,
            startTime: new Date().toISOString(),
            deadline: questDailyElem.checked ? calculateMidnightDeadline() : deadline,
            status: 'Ongoing'
        };

        const quests = loadQuests();
        quests.push(newQuest);
        saveQuests(quests);
        showNotification('Quest added successfully!');
        displayQuests();
    });
}

function calculateDeadline(value, unit) {
    const now = new Date();

    switch (unit) {
        case 'Minute':
            return new Date(now.getTime() + value * 60000).toISOString();
        case 'Hour':
            return new Date(now.getTime() + value * 3600000).toISOString();
        case 'Day':
            return new Date(now.getTime() + value * 86400000).toISOString();
        case 'Week':
            return new Date(now.getTime() + value * 604800000).toISOString();
        case 'Month':
            return new Date(now.setMonth(now.getMonth() + value)).toISOString();
        case 'Year':
            return new Date(now.setFullYear(now.getFullYear() + value)).toISOString();
        default:
            return now.toISOString();
    }
}

function calculateMidnightDeadline() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0); // Set time to midnight
    return midnight.toISOString();
}

// Helper functions to show and close notifications
function showNotification(message) {
    const notification = document.createElement('div');
    notification.classList.add('notification');
    notification.innerHTML = `
        <span class="close-btn" onclick="closeNotification()">×</span>
        <p>${message}</p>
    `;
    document.body.appendChild(notification);
    setTimeout(() => { closeNotification(); }, 1500);
}

function checkAndApplyPenalty(quest, index) {
    const currentTime = new Date();
    const deadlineTime = new Date(quest.deadline);

    if (currentTime > deadlineTime && quest.status === 'Ongoing') {
        const userData = loadUserData();
        const penaltyXP = Math.floor(quest.xpReward / 2);
        userData.currentXP = Math.max(0, userData.currentXP - penaltyXP); // Apply penalty without going below zero

        quest.isFailed = true;
        quest.status = 'Failed'; // Update status
        saveUserData(userData);
        saveQuests(quests); // Save changes
        showNotification(`Quest "${quest.name}" failed. Penalty applied: ${penaltyXP} XP`);
    }
}


function closeNotification() {
    const notification = document.querySelector('.notification');
    if (notification) {
        document.body.removeChild(notification);
    }
}

// Helper functions to show and close notifications
// Helper functions to show and close notifications
function showConfirmation(message, callback) {
    const confirmation = document.createElement('div');
    confirmation.classList.add('notification');
    confirmation.innerHTML = `
        <span class="close-btn" onclick="closeConfirmation()">×</span>
        <p>${message}</p>
        <button onclick="confirmYes()">Yes</button>
        <button onclick="confirmNo()">No</button>
    `;
    document.body.appendChild(confirmation);

    window.confirmYes = function() {
        if (confirmation.parentNode) {
            document.body.removeChild(confirmation);
            callback();
        }
    };
    window.confirmNo = function() {
        if (confirmation.parentNode) {
            document.body.removeChild(confirmation);
        }
    };
}
function closeConfirmation() {
    const confirmation = document.querySelector('.notification');
    if (confirmation) {
        document.body.removeChild(confirmation);
    }
}

const resetButton = document.getElementById('reset-button');
if (resetButton) {
    resetButton.addEventListener('click', function() {
        showConfirmation('Are you sure you want to reset your progress?', () => {
            localStorage.clear();
            location.reload();
        });
    });
} else {
    console.error('Reset button not found!');
}
// Profile Functions
function displayProfile() {
    const userData = loadUserData();

    const usernameElem = document.getElementById('profile-username');
    if (usernameElem) usernameElem.textContent = ` Player: ${userData.username}`;

    const levelElem = document.getElementById('profile-level');
    if (levelElem) levelElem.textContent = userData.currentLevel;

    const xpElem = document.getElementById('profile-xp');
    if (xpElem) xpElem.textContent = userData.currentXP;

    const xpMaxElem = document.getElementById('profile-xp-max');
    if (xpMaxElem) xpMaxElem.textContent = userData.nextLevelXP;

    const xpFill = document.getElementById('xp-bar-fill');
    if (xpFill) {
        const xpPercentage = (userData.currentXP / userData.nextLevelXP) * 100;
        xpFill.style.width = xpPercentage + '%';
    }

    const strengthElem = document.getElementById('profile-strength');
    if (strengthElem) strengthElem.textContent = userData.stats.strength.toFixed(3);

    const intelligenceElem = document.getElementById('profile-intelligence');
    if (intelligenceElem) intelligenceElem.textContent = userData.stats.intelligence.toFixed(3);

    const charmElem = document.getElementById('profile-charm');
    if (charmElem) charmElem.textContent = userData.stats.charm.toFixed(3);

    const agilityElem = document.getElementById('profile-agility');
    if (agilityElem) agilityElem.textContent = userData.stats.agility.toFixed(3);

    const staminaElem = document.getElementById('profile-stamina');
    if (staminaElem) staminaElem.textContent = userData.stats.stamina.toFixed(3);

    const enduranceElem = document.getElementById('profile-endurance');
    if (enduranceElem) enduranceElem.textContent = userData.stats.endurance.toFixed(3);

    const luckElem = document.getElementById('profile-luck');
    if (luckElem) luckElem.textContent = userData.stats.luck.toFixed(3);

    const allRounderElem = document.getElementById('profile-all-rounder');
    if (allRounderElem) allRounderElem.textContent = userData.allRounderStatPoints;
}

document.addEventListener('DOMContentLoaded', function() {
    displayProfile();
});

function checkLevelUp() {
    const userData = loadUserData();
    let leveledUp = false;

    while (userData.currentXP >= userData.nextLevelXP) {
        userData.currentXP -= userData.nextLevelXP;
        userData.currentLevel += 1;
        userData.nextLevelXP = Math.floor(userData.nextLevelXP * 1.1); // Adjust the XP required for the next level
        userData.allRounderStatPoints += calculateStatPoints(userData.currentLevel); // Add stat points for leveling up
        leveledUp = true;
    }

    if (leveledUp) {
        saveUserData(userData);
        displayProfile();
        showNotification('Congratulations! You leveled up!');
    }
}

function calculateStatPoints(level) {
    if (level <= 10) {
        return 1;
    } else if (level <= 20) {
        return 2;
    } else if (level <= 30) {
        return 3;
    } else {
        return Math.floor(level / 10); // Adjust this logic as needed
    }
}

function allocateStat(statName) {
    const userData = loadUserData();
    if (userData.allRounderStatPoints > 0) {
        userData.stats[statName] += 0.001;
        userData.allRounderStatPoints -= 1;
        saveUserData(userData);
        displayProfile();
    } else {
        showNotification('Fucker, Use Your Mind, No unallocated stat points available.');
    }
}

// Update the quest completion logic to include leveling up check
function completeQuest(index) {
    showConfirmation('Adventure, did you really complete your quest?', () => {
        const quests = loadQuests();
        const quest = quests[index];

        if (quest.status === 'Ongoing') {
            quest.status = 'Completed';
            const userData = loadUserData();
            userData.currentXP += quest.xpReward;
            userData.stats[quest.statReward.name.toLowerCase()] += quest.statReward.count / 1000;
            saveUserData(userData);
            saveQuests(quests);
            updateQuestDisplay(index);
            showNotification(`Quest "${quest.name}" has been completed.`);
            checkLevelUp(); // Check for leveling up
        }
    });
}



document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM is ready!');
    displayProfile();
    const path = window.location.pathname;
    const page = path.split("/").pop();

    if (page === 'quests.html') {
        displayQuests(); // Call displayQuests() only on quests.html
    } else if (page === 'history.html') {
        displayQuestHistory(); // Call displayQuestHistory() only on history.html
        renderProgressChart('xp'); // Default metric

        const metricSelect = document.getElementById('metric-select');
        if (metricSelect) {
            metricSelect.addEventListener('change', updateChart);
        }

        const statusSelect = document.getElementById('status-select');
        if (statusSelect) {
            statusSelect.addEventListener('change', function() {
                displayQuestHistory(); // Update both table and chart
                updateChart(); // Update the chart
            });
        }
    }

    const radarChartCtx = document.getElementById('radar-chart');
    if (radarChartCtx) {
        createRadarChart(radarChartCtx.getContext('2d'), loadUserData());
    }

    const resetButton = document.getElementById('reset-button');
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            showConfirmation('Are you sure you want to reset your progress?', () => {
                localStorage.clear();
                location.reload();
            });
        });
    } else {
        console.error('Reset button not found!');
    }
});

function renderProgressChart(metric) {
    const ctx = document.getElementById('progress-chart').getContext('2d');
    const quests = loadQuests();
    const labels = quests.map(quest => new Date(quest.startTime).toLocaleDateString());
    let data;

    if (metric === 'xp') {
        data = quests.map(quest => quest.xpReward);
    } else if (metric === 'stat') {
        data = quests.map(quest => quest.statReward.count);
    } else if (metric === 'count') {
        const statusCount = { completed: 0, ongoing: 0, failed: 0 };
        quests.forEach(quest => {
            statusCount[quest.status.toLowerCase()]++;
        });
        data = Object.values(statusCount);
        labels = ['Completed', 'Ongoing', 'Failed'];
    }

    if (window.progressChart) {
        window.progressChart.destroy();
    }

    window.progressChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: metric === 'xp' ? 'XP Earned' : metric === 'stat' ? 'Stat Rewards' : 'Quest Count',
                data: data,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

let progressChart;

function displayQuestHistory() {
    const statusFilter = document.getElementById('status-select').value;
    const questHistoryTable = document.getElementById('quest-history-table').getElementsByTagName('tbody')[0];
    const quests = loadQuests();
    questHistoryTable.innerHTML = ''; // Clear existing rows

    const filteredQuests = statusFilter === 'all' ? quests : quests.filter(quest => quest.status.toLowerCase() === statusFilter);

    filteredQuests.forEach(quest => {
        const row = questHistoryTable.insertRow();

        row.insertCell(0).textContent = quest.name;
        row.insertCell(1).textContent = quest.type;
        row.insertCell(2).textContent = quest.status;
        row.insertCell(3).textContent = quest.grade;
        row.insertCell(4).textContent = quest.xpReward;
        row.insertCell(5).textContent = `${quest.statReward.name} +${quest.statReward.count}`;
    });
}

function updateChart() {
    const metric = document.getElementById('metric-select').value;
    const statusFilter = document.getElementById('status-select').value;
    const quests = loadQuests();
    let labels = [];
    let data = [];

    let filteredQuests = statusFilter === 'all' ? quests : quests.filter(quest => quest.status.toLowerCase() === statusFilter);

    const dateLabels = [];
    const aggregatedData = {};

    filteredQuests.forEach(quest => {
        const date = new Date(quest.startTime).toLocaleDateString();
        if (!aggregatedData[date]) {
            aggregatedData[date] = { xp: 0, stat: 0, count: 0 };
        }
        aggregatedData[date].xp += quest.xpReward;
        aggregatedData[date].stat += quest.statReward.count;
        aggregatedData[date].count += 1;

        if (!dateLabels.includes(date)) {
            dateLabels.push(date);
        }
    });

    dateLabels.sort((a, b) => new Date(a) - new Date(b));

    dateLabels.forEach(date => {
        labels.push(date);
        switch (metric) {
            case 'xp':
                data.push(aggregatedData[date].xp);
                break;
            case 'stat':
                data.push(aggregatedData[date].stat);
                break;
            case 'count':
                data.push(aggregatedData[date].count);
                break;
        }
    });

    const ctx = document.getElementById('progress-chart').getContext('2d');
    if (window.progressChart) {
        window.progressChart.destroy();
    }
    window.progressChart = new Chart(ctx, {
        type: 'line', // Change chart type to 'line' for area chart
        data: {
            labels: labels,
            datasets: [{
                label: metric,
                data: data,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                fill: true // Enable area fill
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

let radarChart;

function createRadarChart(ctx, userData) {
    if (radarChart) {
        radarChart.destroy(); // Destroy the existing chart
    }
    radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Strength', 'Intelligence', 'Charm', 'Agility', 'Stamina', 'Endurance', 'Luck'],
            datasets: [{
                label: 'Stats',
                data: [
                    userData.stats.strength,
                    userData.stats.intelligence,
                    userData.stats.charm,
                    userData.stats.agility,
                    userData.stats.stamina,
                    userData.stats.endurance,
                    userData.stats.luck
                ],
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                pointBackgroundColor: 'white', // White points
                pointBorderColor: 'rgba(75, 192, 192, 1)',
                pointHoverBackgroundColor: 'rgba(75, 192, 192, 1)',
                pointHoverBorderColor: 'white'
            }]
        },
        options: {
            scales: {
                r: {
                    angleLines: { color: 'rgba(255, 255, 255, 0.2)' }, // Duller angle lines
                    grid: {
                        color: 'rgba(255, 255, 255, 0.2)', // Duller grid lines
                        circular: false, // Polygonal grid lines
                        lineWidth: 1,
                        stepSize: 0.2, // Smaller step size
                    },
                    suggestedMin: 0.6, // Set a minimum value to avoid stats being too close to the center
                    suggestedMax: 1.35, // Set a maximum value to avoid the highest stat touching the border
                    ticks: {
                        display: false,
                        stepSize: 0.04, // Adjust this value to control the gap between the lines
                    },
                    pointLabels: {
                        color: '#e0e0e0',
                        font: {
                            size: 16
                        }
                    }
                }
            }
        }
    });
}

// Ensure this part of the code is called appropriately to create the radar chart
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM is ready!');
    displayProfile();

    const path = window.location.pathname;
    const page = path.split("/").pop();

    if (page === 'quests.html') {
        displayQuests(); // Call displayQuests() only on quests.html
    }

    const radarChartCtx = document.getElementById('radar-chart');
    if (radarChartCtx) {
        createRadarChart(radarChartCtx.getContext('2d'), loadUserData());
    }

    const resetButton = document.getElementById('reset-button');
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            showConfirmation('Are you sure you want to reset your progress?', () => {
                localStorage.clear();
                location.reload();
            });
        });
    } else {
        console.error('Reset button not found!');
    }

    const metricSelect = document.getElementById('metric-select');
    if (metricSelect) {
        metricSelect.addEventListener('change', updateChart);
    }

    const statusSelect = document.getElementById('status-select');
    if (statusSelect) {
        statusSelect.addEventListener('change', () => {
            updateChart();
        });
    }
});

function resetDailyQuests() {
    const quests = loadQuests();
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(0, 0, 0, 0);

    quests.forEach(quest => {
        if (quest.isDaily && quest.status === 'Completed' && new Date(quest.deadline) <= now) {
            quest.status = 'Ongoing';
            quest.deadline = calculateMidnightDeadline();
            quest.xpReward = Math.round(quest.xpReward * (1 + quest.increaseRate / 100));
            quest.statReward.count = Math.round(quest.statReward.count * (1 + quest.increaseRate / 100));
        }
    });

    saveQuests(quests);
    displayQuests();
}
// Call this function periodically to check for failures, e.g., using setInterval
setInterval(() => {
    const quests = loadQuests();
    quests.forEach((quest, index) => {
        checkAndApplyPenalty(quest, index);
    });
}, 60000); // Check every minute


// Set an interval to check and reset daily quests at midnight
setInterval(() => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
        resetDailyQuests();
    }
}, 60000); // Check every minute

document.addEventListener('DOMContentLoaded', function() {
    displayQuests(); // Initial display of quests

    setInterval(updateCountdownTimers, 1000); // Call updateCountdownTimers every second
});

function displayQuests() {
    const questContainer = document.querySelector('.quest-container');
    if (!questContainer) {
        console.error('Quest container not found!');
        return;
    }
    questContainer.innerHTML = '';
    const quests = loadQuests();
    quests.forEach((quest, index) => {
        const questCard = document.createElement('div');
        questCard.classList.add('quest-card');
        questCard.setAttribute('data-index', index);

        const timeLeft = calculateTimeLeft(quest.deadline);
        const statusClass = quest.status === 'Failed' ? 'quest-failed' : '';

        questCard.innerHTML = `
            <h3 class="${statusClass}">${quest.name}</h3>
            <p>Reward: ${quest.xpReward} XP ${quest.statReward.name} +${quest.statReward.count}</p>
            <p>Status: ${quest.status}</p>
            <p class="deadline-timer">${quest.status === 'Completed' ? '' : 'Deadline: ' + timeLeft}</p>
        `;

        questCard.addEventListener('click', () => {
            showQuestDetails(quest, index);
        });

        questContainer.appendChild(questCard);
    });
}


function showQuestDetails(quest, index) {
    const descriptionLines = quest.description.split('\n');
    const checkboxesHtml = descriptionLines.map((line, i) => {
        const isChecked = quest.subtasks && quest.subtasks[i] ? 'checked' : '';
        return `<div class="subtask-container">
                    <label>
                        ➤ ${line}
                        ${quest.status === 'Completed' || quest.status === 'Failed' ? '' : `<input type="checkbox" class="subtask-checkbox" data-index="${i}" style="float: right;" ${isChecked}>`}
                    </label>
                </div>`;
    }).join('');

    const dailyLabel = quest.isDaily ? ' (Daily)' : '';

    const details = `
        <div class="quest-details">
            <h3 class="quest-name">${quest.name} (${quest.grade})${dailyLabel}</h3>
            <div class="description-text">${checkboxesHtml}</div>
            <p class="quest-type">Type: ${quest.type}</p>
            <p class="quest-reward">Reward: ${quest.xpReward} XP, ${quest.statReward.name} +${quest.statReward.count}</p>
            <p class="quest-status">Status: ${quest.status}</p>
            ${quest.status === 'Completed' || quest.status === 'Failed' ? '' : '<div class="button-container"><button id="complete-quest-button" disabled onclick="attemptCompleteQuest(' + index + ')">Complete Quest</button></div>'}
            <span class="close-btn" onclick="closeNotification()">×</span>
        </div>
    `;
    const notification = document.createElement('div');
    notification.classList.add('notification');
    document.body.appendChild(notification);
    notification.innerHTML = details;

    if (quest.status !== 'Completed' && quest.status !== 'Failed') {
        const checkboxes = document.querySelectorAll('.subtask-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const subtaskIndex = checkbox.getAttribute('data-index');
                const isChecked = checkbox.checked;

                if (!quest.subtasks) {
                    quest.subtasks = [];
                }

                quest.subtasks[subtaskIndex] = isChecked;

                const quests = loadQuests();
                quests[index] = quest;
                saveQuests(quests);

                const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                document.getElementById('complete-quest-button').disabled = !allChecked;
            });
        });
    }
}


// Show/hide increase rate field based on daily quest checkbox
document.getElementById('quest-daily').addEventListener('change', function() {
    const isChecked = this.checked;
    document.getElementById('increase-rate-group').style.display = isChecked ? 'block' : 'none';
    document.getElementById('quest-deadline-value').style.display = isChecked ? 'none' : 'block';
    document.getElementById('quest-deadline-unit').style.display = isChecked ? 'none' : 'block';

    // Hide or show labels
    const deadlineLabel = document.querySelector('label[for="quest-deadline-value"]');
    const deadlineUnitLabel = document.querySelector('label[for="quest-deadline-unit"]');
    deadlineLabel.style.display = isChecked ? 'none' : 'block';
    deadlineUnitLabel.style.display = isChecked ? 'none' : 'block';
});


function attemptCompleteQuest(index) {
    const checkboxes = document.querySelectorAll('.subtask-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);

    if (!allChecked) {
        showNotification('Please complete all tasks before completing the quest.');
        return;
    }

    completeQuest(index);
}

function updateQuestDisplay(index) {
    closeNotification();
    const quests = loadQuests();
    showQuestDetails(quests[index], index);
    displayQuests();
}

// Calculate time left for the deadline
function calculateTimeLeft(deadline) {
    const now = new Date();
    const endTime = new Date(deadline); // Parse the ISO date string correctly
    const timeDiff = endTime - now;

    if (timeDiff <= 0) {
        return "Expired";
    }

    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
}

function updateCountdownTimers() {
    const questContainer = document.querySelector('.quest-container');
    if (!questContainer) return;
    const questCards = questContainer.querySelectorAll('.quest-card');
    const quests = loadQuests();

    questCards.forEach((card) => {
        const index = card.getAttribute('data-index');
        const quest = quests[index];
        const timeLeftElem = card.querySelector('.deadline-timer');

        if (quest.status === 'Completed') {
            if (timeLeftElem) {
                timeLeftElem.textContent = ''; // Clear the countdown text for completed quests
            }
            return; // Skip updating the countdown for completed quests
        }

        const timeLeft = calculateTimeLeft(quest.deadline);

        if (timeLeft === "Expired" && quest.status === "Ongoing") {
            quest.status = "Failed"; // Update status to "Failed"

            // Apply penalty: decrease XP by half the reward amount
            const userData = loadUserData();
            const penaltyXP = Math.floor(quest.xpReward / 2);
            userData.currentXP = Math.max(userData.currentXP - penaltyXP, 0); // Ensure XP doesn't go below 0

            saveUserData(userData); // Save updated user data
            saveQuests(quests); // Save the updated quests
            displayProfile(); // Update profile display
        }

        if (timeLeftElem) {
            timeLeftElem.textContent = `Deadline: ${timeLeft}`;
        }

        // Update the status display in the quest card
        const statusElem = card.querySelector('.quest-status');
        if (statusElem) {
            statusElem.textContent = `Status: ${quest.status}`;
        }
    });
}


// Call updateCountdownTimers every second
setInterval(updateCountdownTimers, 1000);

// Function to display recent activity
function displayRecentActivity() {
    const recentActivityList = document.getElementById('recent-activity-list');
    if (recentActivityList) {
        recentActivityList.innerHTML = '';
        const activities = loadRecentActivities();
        activities.forEach(activity => {
            const listItem = document.createElement('li');
            listItem.textContent = activity;
            recentActivityList.appendChild(listItem);
        });
    }
}

// Define the plugin
const centerDotPlugin = {
  id: 'centerDot',
  afterDraw: function(chart) {
    if (chart.config.type === 'radar') {
      const ctx = chart.ctx;
      const xCenter = chart.scales.r.xCenter;
      const yCenter = chart.scales.r.yCenter;

      ctx.beginPath();
      ctx.arc(xCenter, yCenter, 5, 0, 2 * Math.PI); // Adjust the size of the dot (5)
      ctx.fillStyle = 'white'; // Color of the dot
      ctx.fill();
    }
  }
};

// Ensure this part of the code is called appropriately to create the radar chart
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM is ready!');
  displayProfile();

  const path = window.location.pathname;
  const page = path.split("/").pop();

  if (page === 'quests.html') {
    displayQuests(); // Call displayQuests() only on quests.html
  }

  const radarChartCtx = document.getElementById('radar-chart');
  if (radarChartCtx) {
    createRadarChart(radarChartCtx.getContext('2d'), loadUserData());
  }

  const resetButton = document.getElementById('reset-button');
  if (resetButton) {
    resetButton.addEventListener('click', function() {
      showConfirmation('Are you sure you want to reset your progress?', () => {
        localStorage.clear();
        location.reload();
      });
    });
  } else {
    console.error('Reset button not found!');
  }

  const metricSelect = document.getElementById('metric-select');
  if (metricSelect) {
    metricSelect.addEventListener('change', updateChart);
  }

  const statusSelect = document.getElementById('status-select');
  if (statusSelect) {
    statusSelect.addEventListener('change', () => {
      updateChart();
    });
  }
});