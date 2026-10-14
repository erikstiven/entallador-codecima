import React from 'react';
import { LandingApp } from '@/landing/LandingApp';
import { useAppRoute } from '@/landing/router/landingRouteStore';
import { WorkshopApp } from '@/views/WorkshopApp';
import { GlobalAlertHost } from '@/core/ui/GlobalAlertHost';

export const App: React.FC = () => {
  const { mode } = useAppRoute();

  return (
    <>
      {mode === 'workshop' ? <WorkshopApp /> : <LandingApp />}
      <GlobalAlertHost />
    </>
  );
};

