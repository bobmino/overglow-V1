import express from 'express';
const router = express.Router();

router.get('/layout', (req, res) => {
  // Logique pour récupérer la layout de la homepage
  res.json({ message: 'Homepage layout fetched successfully' });
});

export default router;
