document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const activities = {};

  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");
  }

  function renderActivities() {
    activitiesList.replaceChildren();

    Object.entries(activities).forEach(([name, details]) => {
      const activityCard = document.createElement("article");
      activityCard.className = "activity-card";

      const title = document.createElement("h4");
      title.textContent = name;
      activityCard.appendChild(title);

      const description = document.createElement("p");
      description.textContent = details.description;
      activityCard.appendChild(description);

      const schedule = document.createElement("p");
      const scheduleLabel = document.createElement("strong");
      scheduleLabel.textContent = "Schedule: ";
      schedule.append(scheduleLabel, document.createTextNode(details.schedule));
      activityCard.appendChild(schedule);

      const availability = document.createElement("p");
      const availabilityLabel = document.createElement("strong");
      availabilityLabel.textContent = "Availability: ";
      availability.append(
        availabilityLabel,
        document.createTextNode(`${details.max_participants - details.participants.length} spots left`)
      );
      activityCard.appendChild(availability);

      const participantsSection = document.createElement("div");
      participantsSection.className = "participants-section";
      const participantsTitle = document.createElement("h5");
      participantsTitle.textContent = "Registered students";
      participantsSection.appendChild(participantsTitle);

      const participantList = document.createElement("ul");
      participantList.className = "participant-list";
      details.participants.forEach((email) => {
        const participant = document.createElement("li");
        participant.className = "participant-item";

        const participantEmail = document.createElement("span");
        participantEmail.className = "participant-email";
        participantEmail.textContent = email;
        participant.appendChild(participantEmail);

        const removeButton = document.createElement("button");
        removeButton.className = "remove-participant";
        removeButton.type = "button";
        removeButton.setAttribute("aria-label", `Remove ${email} from ${name}`);
        removeButton.title = `Remove ${email}`;
        removeButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3" /></svg>';
        removeButton.addEventListener("click", async () => {
          removeButton.disabled = true;
          try {
            const query = new URLSearchParams({ email });
            const response = await fetch(
              `/activities/${encodeURIComponent(name)}/signup?${query}`,
              { method: "DELETE" }
            );
            const result = await response.json();

            if (!response.ok) {
              throw new Error(result.detail || "Unable to remove student");
            }

            activities[name].participants = activities[name].participants.filter(
              (participantEmail) => participantEmail !== email
            );
            renderActivities();
            showMessage(result.message, "success");
          } catch (error) {
            showMessage(error.message || "Failed to remove student. Please try again.", "error");
            removeButton.disabled = false;
          }
        });
        participant.appendChild(removeButton);
        participantList.appendChild(participant);
      });
      participantsSection.appendChild(participantList);
      activityCard.appendChild(participantsSection);
      activitiesList.appendChild(activityCard);
    });
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      if (!response.ok) {
        throw new Error("Unable to load activities");
      }

      Object.assign(activities, await response.json());
      renderActivities();

      Object.keys(activities).forEach((name) => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.textContent = "Failed to load activities. Please try again later.";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
        const query = new URLSearchParams({ email });
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?${query}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        activities[activity].participants.push(email);
        renderActivities();
        showMessage(result.message, "success");
        signupForm.reset();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
