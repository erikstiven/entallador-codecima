import React from 'react';
import { LandingApp } from '@/landing/LandingApp';
import { useAppRoute } from '@/landing/router/landingRouteStore';
import { WorkshopApp } from '@/views/WorkshopApp';

export const App: React.FC = () => {
  const { mode } = useAppRoute();

  if (mode === 'workshop') {
    return <WorkshopApp />;
  }

  return <LandingApp />;
};
