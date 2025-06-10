import React, { useState, useEffect } from 'react';
import { Container, Button, Grid, Card, CardMedia, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { styled } from '@mui/system';

// The API key is provided by the user.
const API_KEY = '95a7664f-c4d5-47ac-b837-1b2d063904e3';

// Styled component for a responsive image within the card
const ResponsiveCardMedia = styled(CardMedia)(({ theme }) => ({
  width: '100%',
  height: 'auto',
  // Ensure images scale down nicely on smaller screens
  [theme.breakpoints.down('sm')]: {
    maxWidth: '100%',
  },
  // Add some consistent spacing below the image for text
  marginBottom: theme.spacing(1),
}));

// Styled component for the main card, with a subtle hover effect
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2, // More rounded corners
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  height: '100%', // Ensure all cards in the grid have the same height
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)', // Lift card slightly on hover
  },
  boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)', // Subtle shadow
}));

// Main App component for the Pokemon Pack Simulator
function App() {
  const [allCards, setAllCards] = useState([]); // Stores all fetched cards from the set
  const [pack, setPack] = useState([]); // Stores the cards opened in the current pack
  const [loading, setLoading] = useState(true); // Manages loading state for API call
  const [error, setError] = useState(null); // Stores any error messages from API or logic

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
    // Define a broader set of 'rare' categories as per typical pack contents
    // Includes various "Rare" types, Ultra Rares, Secret Rares, and modern high-rarity cards
    const rares = allCards.filter(card =>
      card.rarity && (
        card.rarity.includes('Rare') ||
        card.rarity.includes('Ultra') ||
        card.rarity.includes('Secret') ||
        card.rarity.includes('Amazing') ||
        card.rarity.includes('Prism') ||
        card.rarity.includes('VMAX') ||
        card.rarity.includes('VSTAR') ||
        card.rarity.includes('BREAK') ||
        card.rarity.includes('Radiant') ||
        card.rarity.includes('Trainer Gallery Rare Holo') // Specific to some modern sets
      )
    );

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

    // 3. Add 1 Rare card (can be Holo Rare or Ultra Rare)
    // Ensure there are rare cards available before attempting to add
    if (rares.length > 0) {
      const rareCard = getRandomCard(rares);
      addCardToPack(rareCard);
    } else {
      console.warn("Not enough 'Rare' cards found in the set to guarantee a pull. Adding a common or uncommon instead.");
      // Fallback: If no rares are found, add another common or uncommon
      const fallbackCard = getRandomCard(commons.length > 0 ? commons : uncommons);
      addCardToPack(fallbackCard);
    }

    // 4. Add 1 Reverse Holo (any rarity)
    // Select a random card from *all* available cards for the reverse holo slot
    if (allCards.length > 0) {
      const reverseHoloCard = getRandomCard(allCards);
      addCardToPack(reverseHoloCard, true); // Mark as reverse holo
    } else {
      console.warn("No cards available to select a reverse holo.");
    }

    // Shuffle the pack to make the reveal more dynamic (optional)
    // newPack.sort(() => Math.random() - 0.5);
    setPack(newPack); // Update the pack state with the new cards
  };

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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700, color: '#3f51b5' }}>
        Pokémon Pack Simulator
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
        Open a booster pack!
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
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
      </Box>

      {pack.length > 0 && (
        <>
          <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 6, mb: 4, fontWeight: 600, color: '#3f51b5' }}>
            Your Pack
          </Typography>
          <Grid container spacing={3} justifyContent="center">
            {pack.map((card) => ( // Removed index from map for clarity as _instanceId is used for key
              <Grid item xs={12} sm={6} md={3} key={card._instanceId}> {/* Use _instanceId for unique key */}
                <StyledCard sx={{ border: card.isReverseHolo ? '4px solid gold' : 'none', }}>
                  <ResponsiveCardMedia
                    component="img"
                    image={card.images.small}
                    alt={card.name}
                    onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/200x280/cccccc/000000?text=Image+Not+Found`; }} // Fallback image on error
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
        </>
      )}
    </Container>
  );
}

export default App;
