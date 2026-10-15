import React from 'react';
import { useAppRoute } from '@/landing/router/landingRouteStore';
import { GlobalAlertHost } from '@/core/ui/GlobalAlertHost';
import { LandingApp } from '@/landing/LandingApp';
import { WorkshopApp } from '@/views/WorkshopApp';

export const App: React.FC = () => {
  const { mode } = useAppRoute();

  return (
    <>
      {mode === 'workshop' ? <WorkshopApp /> : <LandingApp />}
      <GlobalAlertHost />
    </>
  );
};


