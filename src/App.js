import React, { useState, useEffect } from 'react';
import { Container, Button, Grid, Card, CardMedia, Typography, Box, CircularProgress, Alert, Popover } from '@mui/material';
import { styled } from '@mui/system';

// The API key is provided by the user.
const API_KEY = '95a7664f-c4d5-47ac-b837-1b2d063904e3';

// Styled component for a responsive image within the card
const ResponsiveCardMedia = styled(CardMedia)(({ theme }) => ({
  width: '100%',
  height: 'auto',
  maxWidth: '250px', // Max width for a single card in reveal mode
  margin: '0 auto', // Center the image
  [theme.breakpoints.down('sm')]: {
    maxWidth: '180px', // Adjust max width for smaller screens
  },
  marginBottom: theme.spacing(1),
}));

// Styled component for the main card, with a subtle hover effect
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2, // More rounded corners
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  height: 'auto', // Auto height as we're showing one card at a time or grid
  minHeight: '400px', // Minimum height to prevent collapse
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)', // Lift card slightly on hover
  },
  boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)', // Subtle shadow
  position: 'relative', // Needed for positioning the popover correctly
}));

// Main App component for the Pokemon Pack Simulator
function App() {
  const [allCards, setAllCards] = useState([]); // Stores all fetched cards from the set
  const [pack, setPack] = useState([]); // Stores the cards opened in the current pack
  const [loading, setLoading] = useState(true); // Manages loading state for API call
  const [error, setError] = useState(null); // Stores any error messages from API or logic
  const [revealedCardIndex, setRevealedCardIndex] = useState(-1); // Tracks the index of the currently revealed card (-1 means none)
  const [currentInsight, setCurrentInsight] = useState(null); // Stores the insight text
  const [insightAnchorEl, setInsightAnchorEl] = useState(null); // Anchor element for the insight popover
  const [showAllCards, setShowAllCards] = useState(false); // New state to toggle between single card view and all cards grid

  // useEffect hook to fetch cards from the Lost Origin set when the component mounts
  useEffect(() => {
    const fetchCards = async () => {
      setLoading(true); // Start loading
      setError(null);    // Clear previous errors

      try {
        const setCode = 'swsh11'; // Set code for Lost Origin
        // Construct the API URL for Lost Origin cards
        const apiUrl = `https://api.pokemontcg.io/v2/cards?q=set.id:${setCode}`;

        // Make a direct fetch call to the TCG API
        const response = await fetch(apiUrl, {
          headers: {
            'X-Api-Key': API_KEY // API key is passed in headers for direct API calls
          }
        });

        if (!response.ok) {
          // If the HTTP response was not ok, throw an error with the status
          const errorText = await response.text();
          throw new Error(`API call failed with status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        // The API returns card data directly in the 'data' array
        // Filter out cards without images or with 'promo' rarity, which might not be suitable for packs
        const filteredCards = data.data.filter(card => card.images?.small && card.rarity !== 'Promo');
        setAllCards(filteredCards);
        setLoading(false); // Set loading to false after successful fetch
      } catch (err) {
        // Catch any errors during the API call and set the error state
        console.error("Error fetching cards:", err);
        setError(`Failed to load cards: ${err.message}. Please check your internet connection or API key.`);
        setLoading(false); // Stop loading even if there's an error
      }
    };

    fetchCards();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Helper function to get cards filtered by a specific rarity
  const getCardsByRarity = (rarity) => {
    return allCards.filter(card => card.rarity === rarity);
  };

  // Helper function to get a random card from a given list
  const getRandomCard = (cardList) => {
    if (!cardList || cardList.length === 0) {
      return null; // Return null if the list is empty or invalid
    }
    const randomIndex = Math.floor(Math.random() * cardList.length);
    return cardList[randomIndex];
  };

  // Function to simulate opening a booster pack
  const simulatePackOpening = () => {
    const newPack = []; // Array to hold cards for the new pack

    // Filter cards into categories based on specified rarities
    const commons = getCardsByRarity('Common');
    const uncommons = getCardsByRarity('Uncommon');

    const reverseHolos = allCards.filter(card => 
      card.rarity && (
        card.rarity === 'Common' ||
        card.rarity === 'Uncommon' ||
        card.rarity === 'Rare'
      )
    );

    // Separating standard rares from ultra rares for weighted pulling
    const standardRares = allCards.filter(card => 
      card.rarity && (
        card.rarity === 'Rare Holo' ||
        card.rarity === 'Rare'
      )
    );

    const ultraRares = allCards.filter(card =>
      card.rarity && (
        card.rarity.includes('Rare Ultra') ||
        card.rarity.includes('Rare Secret') ||
        card.rarity.includes('VMAX') ||
        card.rarity.includes('VSTAR') ||
        card.rarity.includes('Radiant') ||
        card.rarity.includes('Amazing') ||
        card.rarity.includes('Prism') ||
        card.rarity.includes('BREAK') ||
        card.rarity.includes('Trainer Gallery Rare Holo') // Considered higher rarity for this purpose
      )
    );

    // Define the probability for pulling an ultra rare (e.g., 12.5%)
    const ULTRA_RARE_CHANCE = 0.125; // 12.5% chance to pull an ultra rare

    // Helper to add a card to the pack with a unique instance ID for React keys
    const addCardToPack = (card, isReverseHolo = false) => {
      if (card) {
        // Generate a unique ID for each card instance in the pack using crypto.randomUUID()
        const uniqueInstanceId = `${card.id}-${crypto.randomUUID()}`;
        newPack.push({
          ...card,
          _instanceId: uniqueInstanceId, // Add a unique property for the key
          isReverseHolo: isReverseHolo
        });
      }
    };

    // 1. Add 5 Commons to the pack
    for (let i = 0; i < 5; i++) {
      const card = getRandomCard(commons);
      addCardToPack(card);
    }

    // 2. Add 3 Uncommons to the pack
    for (let i = 0; i < 3; i++) {
      const card = getRandomCard(uncommons);
      addCardToPack(card);
    }

    // 3. Add 1 Reverse Holo (any rarity)
    // Select a random card from *all* available cards for the reverse holo slot
    let reverseHoloCard = null;
    if (allCards.length > 0) {
      const roll = Math.random();
      if (roll < ULTRA_RARE_CHANCE && ultraRares.length > 0) {
        // Pull an ultra rare card
        reverseHoloCard = getRandomCard(ultraRares);
      }
      else {
        reverseHoloCard = getRandomCard(reverseHolos);
      }
      addCardToPack(reverseHoloCard, true); // Mark as reverse holo
    } else {
      console.warn("No cards available to select a reverse holo.");
    }

    // 4. Add 1 Rare card (now with weighted probability for ultra rares)
    let rareCard = null;
    const roll = Math.random(); // Generate a random number between 0 and 1

    if (roll < ULTRA_RARE_CHANCE && ultraRares.length > 0) {
      // Pull an ultra rare card
      rareCard = getRandomCard(ultraRares);
      if (!rareCard && standardRares.length > 0) { // Fallback if no ultra rares found but rolled for one
        rareCard = getRandomCard(standardRares);
      }
    } else if (standardRares.length > 0) {
      // Pull a standard rare card
      rareCard = getRandomCard(standardRares);
      if (!rareCard && ultraRares.length > 0) { // Fallback if no standard rares found
        rareCard = getRandomCard(ultraRares);
      }
    } else {
      // Fallback if neither standard nor ultra rares are available
      console.warn("Not enough 'Rare' cards found (standard or ultra). Adding a common or uncommon instead.");
      rareCard = getRandomCard(commons.length > 0 ? commons : uncommons);
    }
    addCardToPack(rareCard);

    // Shuffle the pack to make the reveal more dynamic (optional)
    // newPack.sort(() => Math.random() - 0.5);
    setPack(newPack); // Update the pack state with the new cards
    setRevealedCardIndex(-1); // Reset revealed card index to -1 so no card is initially shown
    setShowAllCards(false); // Reset to single card view when opening a new pack
    handleCloseInsight(); // Close any open insights when a new pack is opened
  };

  // Function to handle revealing the next card in the pack
  const handleRevealNextCard = () => {
    if (revealedCardIndex < pack.length - 1) {
      setRevealedCardIndex(prevIndex => prevIndex + 1);
      handleCloseInsight(); // Close insight when revealing a new card
    }
  };

  // Function to handle revealing the previous card in the pack
  const handleRevealPreviousCard = () => {
    if (revealedCardIndex > 0) {
      setRevealedCardIndex(prevIndex => prevIndex - 1);
      handleCloseInsight(); // Close insight when revealing a new card
    }
  };

  // Handle closing the insight popover
  const handleCloseInsight = () => {
    setInsightAnchorEl(null);
    setCurrentInsight(null);
  };

  const openInsight = Boolean(insightAnchorEl);
  const insightId = openInsight ? 'card-insight-popover' : undefined;

  // Render logic based on loading and error states
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="h5" color="text.secondary">Loading cards...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          <Typography variant="h6">{error}</Typography>
          <Typography variant="body1">Please ensure your API token is correct and you have an active internet connection. You can try refreshing the page.</Typography>
        </Alert>
      </Container>
    );
  }

  // Determine if the "Next Card" button should be disabled
  const isNextButtonDisabled = pack.length === 0 || revealedCardIndex >= pack.length - 1;
  // Determine if the "Previous Card" button should be disabled
  const isPreviousButtonDisabled = revealedCardIndex <= 0;

  // Get the currently displayed card
  const currentCard = pack[revealedCardIndex];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700, color: '#3f51b5' }}>
        Pokémon Lost Origin Pack Simulator
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
        Open a booster pack!
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={simulatePackOpening}
          disabled={allCards.length === 0} // Disable button if no cards are loaded
          size="large"
          sx={{
            padding: '12px 30px',
            borderRadius: '50px',
            fontSize: '1.2rem',
            boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.2)',
            '&:hover': {
              boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.3)',
              transform: 'translateY(-2px)',
            },
            transition: 'all 0.3s ease-in-out',
            background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
            color: 'white',
          }}
        >
          Open Booster Pack
        </Button>

        {pack.length > 0 && ( // Only show toggle button if a pack has been opened
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => setShowAllCards(prev => !prev)}
            size="large"
            sx={{
              padding: '12px 30px',
              borderRadius: '50px',
              fontSize: '1.2rem',
              boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.1)',
              '&:hover': {
                boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.2)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease-in-out',
            }}
          >
            {showAllCards ? 'Show One Card' : 'Show All Cards'}
          </Button>
        )}
      </Box>

      {pack.length > 0 && !showAllCards && revealedCardIndex === -1 && (
        <Typography variant="h5" color="text.secondary" sx={{ mt: 4, padding: '12px 30px'}}>
          Pack opened! Click "Reveal First Card" to see your pull.
        </Typography>
      )}

      {pack.length > 0 && showAllCards ? ( // Display all cards if showAllCards is true
        <>
          <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 6, mb: 4, fontWeight: 600, color: '#3f51b5' }}>
            Your Full Pack
          </Typography>
          <Grid container spacing={3} justifyContent="center">
            {pack.map((card) => (
              <Grid item xs={12} sm={6} md={3} key={card._instanceId}>
                <StyledCard sx={{ border: card.isReverseHolo ? '4px solid gold' : 'none' }}>
                  <ResponsiveCardMedia
                    component="img"
                    image={card.images.small}
                    alt={card.name}
                    onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/200x280/cccccc/000000?text=Image+Not+Found`; }}
                  />
                  <Box sx={{ p: 1, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <Typography variant="subtitle1" component="div" sx={{ fontWeight: 500 }}>
                      {card.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Rarity: {card.rarity} {card.isReverseHolo && <span style={{ fontWeight: 'bold', color: 'gold' }}>(Reverse Holo)</span>}
                    </Typography>
                  </Box>
                </StyledCard>
              </Grid>
            ))}
          </Grid>
          <Popover
            id={insightId}
            open={openInsight}
            anchorEl={insightAnchorEl}
            onClose={handleCloseInsight}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
          >
            <Box sx={{ p: 2, maxWidth: 300 }}>
              {currentInsight ? (
                <Typography variant="body2">{currentInsight}</Typography>
              ) : (
                <CircularProgress size={20} />
              )}
            </Box>
          </Popover>
        </>
      ) : ( // Display single card and navigation if showAllCards is false
        <>
          {pack.length > 0 && revealedCardIndex !== -1 && ( // Only show single card if a card is revealed
            <>
              <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 6, mb: 4, fontWeight: 600, color: '#3f51b5' }}>
                Your Card ({revealedCardIndex + 1}/{pack.length})
              </Typography>
              <Grid container spacing={3} justifyContent="center">
                <Grid item xs={12} sm={6} md={4} lg={3} key={currentCard._instanceId}>
                  <StyledCard sx={{ border: currentCard.isReverseHolo ? '4px solid gold' : 'none', }}>
                    <ResponsiveCardMedia
                      component="img"
                      image={currentCard.images.small}
                      alt={currentCard.name}
                      onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/200x280/cccccc/000000?text=Image+Not+Found`; }}
                    />
                    <Box sx={{ p: 1, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                      <Typography variant="subtitle1" component="div" sx={{ fontWeight: 500 }}>
                        {currentCard.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Rarity: {currentCard.rarity} {currentCard.isReverseHolo && <span style={{ fontWeight: 'bold', color: 'gold' }}>(Reverse Holo)</span>}
                      </Typography>
                    </Box>
                  </StyledCard>
                </Grid>
              </Grid>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleRevealPreviousCard}
                  disabled={isPreviousButtonDisabled}
                  sx={{
                    borderRadius: '50px',
                    fontSize: '1rem',
                  }}
                >
                  Previous Card
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleRevealNextCard}
                  disabled={isNextButtonDisabled}
                  sx={{
                    borderRadius: '50px',
                    fontSize: '1rem',
                  }}
                >
                  Next Card
                </Button>
              </Box>
              <Popover
                id={insightId}
                open={openInsight}
                anchorEl={insightAnchorEl}
                onClose={handleCloseInsight}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'center',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'center',
                }}
              >
                <Box sx={{ p: 2, maxWidth: 300 }}>
                  {currentInsight ? (
                    <Typography variant="body2">{currentInsight}</Typography>
                  ) : (
                    <CircularProgress size={20} />
                  )}
                </Box>
              </Popover>
            </>
          )}

          {pack.length > 0 && revealedCardIndex === -1 && ( // Show reveal first card button when no card is revealed
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleRevealNextCard}
              disabled={isNextButtonDisabled}
              size="large"
              sx={{
                padding: '12px 30px',
                borderRadius: '50px',
                fontSize: '1.2rem',
                boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.1)',
                '&:hover': {
                  boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.2)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease-in-out',
              }}
            >
              Reveal First Card
            </Button>
          )}
        </>
      )}
    </Container>
  );
}

export default App;
