package subscriptions

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"services/webhooks/commons"
	"services/webhooks/handler"
	"services/webhooks/token"
	"strings"
	"time"
)

// Generated by https://quicktype.io

type Response struct {
	Total        int64      `json:"total"`
	Data         []Data     `json:"data"`
	MaxTotalCost int64      `json:"max_total_cost"`
	TotalCost    int64      `json:"total_cost"`
	Pagination   Pagination `json:"pagination"`
}

type Data struct {
	ID        string    `json:"id"`
	Status    Status    `json:"status"`
	Type      string    `json:"type"`
	Version   string    `json:"version"`
	Condition Condition `json:"condition"`
	CreatedAt string    `json:"created_at"`
	Transport Transport `json:"transport"`
	Cost      int64     `json:"cost"`
}

type Condition struct {
	BroadcasterUserID     *string `json:"broadcaster_user_id,omitempty"`
	RewardID              *string `json:"reward_id,omitempty"`
	FromBroadcasterUserID *string `json:"from_broadcaster_user_id,omitempty"`
	ToBroadcasterUserID   *string `json:"to_broadcaster_user_id,omitempty"`
	ModeratorUserID       *string `json:"moderator_user_id,omitempty"`
	UserId                *string `json:"user_id,omitempty"`
}

func (c *Condition) Equal(other *Condition) bool {
	return normalize(c.BroadcasterUserID) == normalize(other.BroadcasterUserID) &&
		normalize(c.RewardID) == normalize(other.RewardID) &&
		normalize(c.FromBroadcasterUserID) == normalize(other.FromBroadcasterUserID) &&
		normalize(c.ToBroadcasterUserID) == normalize(other.ToBroadcasterUserID) &&
		normalize(c.ModeratorUserID) == normalize(other.ModeratorUserID) &&
		normalize(c.UserId) == normalize(other.UserId)
}

// normalize handles nil values by converting them to an empty string
func normalize(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

type Transport struct {
	Method   Method `json:"method"`
	Callback string `json:"callback"`
}

type Pagination struct {
	Cursor *string `json:"cursor"`
}

type Status string

const (
	Enabled Status = "enabled"
)

type Method string

const (
	Webhook Method = "webhook"
)

var SubscriptionList []Data

func List() {
	// Create an HTTP client
	client := &http.Client{}

	var TWITCH_EVENTSUB_CLIENTID string = os.Getenv("TWITCH_EVENTSUB_CLIENTID")

	var cursor *string
	for {
		if cursor != nil {
			commons.Debug("Getting list with cursor " + *cursor)
		} else {
			commons.Debug("Getting list without cursor")
		}

		url := "https://api.twitch.tv/helix/eventsub/subscriptions"
		if cursor != nil {
			url = url + "?after=" + *cursor
		}

		// Create a GET request
		req, err := http.NewRequest("GET", url, nil)
		if err != nil {
			fmt.Println("Error creating request:", err)
			return
		}

		// Set request headers
		token, err := token.Access()
		if err != nil {
			fmt.Println("Error creating request:", err)
			return
		}

		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Client-Id", TWITCH_EVENTSUB_CLIENTID)

		// Send the request
		resp, err := client.Do(req)
		if err != nil {
			fmt.Println("Error sending request:", err)
			return
		}
		defer resp.Body.Close()

		// Read the response body
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			fmt.Println("Error reading response:", err)
			return
		}

		// Unmarshal the response body into a Response struct
		var response Response
		err = json.Unmarshal(body, &response)
		if err != nil {
			fmt.Println("Error unmarshaling response:", err)
			return
		}

	OuterLoop:
		for _, value := range response.Data {
			if !strings.Contains(value.Transport.Callback, handler.EVENTSUB_URL_PROD) || value.Status == "authorization_revoked" {
				commons.Debug(fmt.Sprintf("Cleaning up subscription %s, type: %s with callback: %s\n", value.ID, value.Type, value.Transport.Callback))
				DeleteSubscription(value.ID, token)
			} else {
				// check if subscription is new
				for _, item := range SubscriptionList {
					// condition to strings so we can check
					condition1, err := json.Marshal(value.Condition)
					if err != nil {
						fmt.Println("Error marshaling map to JSON:", err)
						return
					}
					// we need to remarshal the condition to objects to compare
					var conditionMarshalledDefined Condition
					err = json.Unmarshal(condition1, &conditionMarshalledDefined)
					if err != nil {
						fmt.Println("Error unmarshaling:", err)
						return
					}

					condition2, err := json.Marshal(item.Condition)
					if err != nil {
						fmt.Println("Error marshaling map to JSON:", err)
						return
					}
					// we need to remarshal the condition to objects to compare
					var conditionMarshalledReceived Condition
					err = json.Unmarshal(condition2, &conditionMarshalledReceived)
					if err != nil {
						fmt.Println("Error unmarshaling:", err)
						return
					}
					if item.Type == value.Type && item.Version == value.Version && conditionMarshalledDefined.Equal(&conditionMarshalledReceived) {
						// skip
						continue OuterLoop
					}
				}
				SubscriptionList = append(SubscriptionList, value)
			}
		}

		if response.Pagination.Cursor != nil {
			time.Sleep(time.Second)
			cursor = response.Pagination.Cursor
		} else {
			break
		}
	}
}

func DeleteSubscription(subscriptionId string, token string) {
	var TWITCH_EVENTSUB_CLIENTID string = os.Getenv("TWITCH_EVENTSUB_CLIENTID")

	url := "https://api.twitch.tv/helix/eventsub/subscriptions?id=" + subscriptionId
	req, err := http.NewRequest("DELETE", url, nil)
	if err != nil {
		fmt.Println("Error creating request:", err)
		return
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Client-Id", TWITCH_EVENTSUB_CLIENTID)

	// Send the request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error sending request:", err)
		return
	}
	defer resp.Body.Close()
}
