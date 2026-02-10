import { redirect } from 'next/navigation';

// Redirect to home - recipes are displayed in a modal on the home page
export default function RecipesPage() {
  redirect('/');
}
