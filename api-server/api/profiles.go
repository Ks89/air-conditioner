package api

import (
	"github.com/gin-gonic/contrib/sessions"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.uber.org/zap"
	"net/http"
	"time"

	"api-server/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/net/context"
)

type ProfileResponse struct {
	ID     primitive.ObjectID `json:"id"`
	Github GithubResponse     `json:"github"`
}

type GithubResponse struct {
	Login     string `json:"login"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	AvatarURL string `json:"avatarURL"`
}

type Profiles struct {
	collection *mongo.Collection
	ctx        context.Context
	logger     *zap.SugaredLogger
}

func NewProfiles(ctx context.Context, logger *zap.SugaredLogger, collection *mongo.Collection) *Profiles {
	return &Profiles{
		collection: collection,
		ctx:        ctx,
		logger:     logger,
	}
}

func (handler *Profiles) GetProfile(c *gin.Context) {
	handler.logger.Debug("GetProfile called")

	var profile models.Profile
	var ok bool
	session := sessions.Default(c).Get("profile")
	if profile, ok = session.(models.Profile); ok {
		var profileToReturn ProfileResponse
		profileToReturn.ID = profile.ID
		profileToReturn.Github = GithubResponse{
			Email:     profile.Github.Email,
			Login:     profile.Github.Login,
			Name:      profile.Github.Name,
			AvatarURL: profile.Github.AvatarURL,
		}
		c.JSON(http.StatusOK, gin.H{"profile": profileToReturn})
		return
	}

	c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot get user profile"})
}

// swagger:operation POST /profiles/:id/token
// Generate/update profile token to register new devices
// ---
// produces:
// - application/json
// responses:
//     '200':
//         description: Successful operation
//     '400':
//         description: Invalid input
func (handler *Profiles) PostProfilesToken(c *gin.Context) {
	handler.logger.Debug("PostProfilesToken called")

	id := c.Param("id")
	var profile models.Profile
	if err := c.ShouldBindJSON(&profile); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// check it the profile you are trying to update is your profile
	session := sessions.Default(c)
	profileSessionId := session.Get("profile").(models.Profile).ID

	profileId, _ := primitive.ObjectIDFromHex(id)

	if profileSessionId != profileId {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot re-generate ApiToken for a different profile then yours"})
		return
	}

	apiToken := uuid.NewString()

	_, err := handler.collection.UpdateOne(handler.ctx, bson.M{
		"_id": profileId,
	}, bson.M{
		"$set": bson.M{
			"apiToken":   apiToken,
			"modifiedAt": time.Now(),
		},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"apiToken": apiToken})
}