/**
 * corridors.js - Field Marketing Highway Route Corridors & Map-Sequential Stops
 * 
 * Arranges all 100+ cities/areas in Gurdaspur district into realistic highway corridors
 * in exact road/map order from origin (Gurdaspur) outwards to destination and back.
 */

const CORRIDORS = [
  {
    id: 'corridor-batala',
    name: 'Route 1: Gurdaspur ➔ Dhariwal ➔ Batala (NH-54 South)',
    shortName: 'Batala Corridor',
    highway: 'NH-54 South',
    stops: [
      {
        displayName: 'Gurdaspur City & Hub',
        primaryCity: 'Gurdaspur',
        aliases: ['gurdaspur', 'jail road', 'old bus stand', 'near beant college', 'krishna nagar', 'mag. road', 'magar mudian', 'pandori', 'halla chaia', 'pachowal']
      },
      {
        displayName: 'Jaura Chattran',
        primaryCity: 'Jaura Chattran',
        aliases: ['jaura chattran']
      },
      {
        displayName: 'Dhariwal',
        primaryCity: 'Dhariwal',
        aliases: ['dhariwal', 'dadwan', 'kokhar', 'kundha', 'kot santokh rai']
      },
      {
        displayName: 'Naushera Majha Singh',
        primaryCity: 'Naushera Majha Singh',
        aliases: ['naushera majha singh', 'panj grahiyan']
      },
      {
        displayName: 'Udhanwal',
        primaryCity: 'Udhanwal',
        aliases: ['udhanwal']
      },
      {
        displayName: 'Wadala Granthian / Bangar',
        primaryCity: 'Wadala Granthia',
        aliases: ['wadala granthia', 'wadla granthia', 'wadala bangar']
      },
      {
        displayName: 'Seikhwan',
        primaryCity: 'Seikhwan',
        aliases: ['seikhwan', 'sanghar']
      }
    ]
  },
  {
    id: 'corridor-pathankot',
    name: 'Route 2: Gurdaspur ➔ Dinanagar ➔ Pathankot (NH-54 North)',
    shortName: 'Pathankot Corridor',
    highway: 'NH-54 North',
    stops: [
      {
        displayName: 'Paniar / Hardochanni',
        primaryCity: 'Paniar',
        aliases: ['paniar', 'hardochanni', 'keshopur']
      },
      {
        displayName: 'Dinanagar Hub',
        primaryCity: 'Dinanagar',
        aliases: ['dinanagar', 'allechak', 'bagwanpur', 'barnala', 'bhulle chak', 'jande chak', 'jangal bhawani', 'amipur', 'saidowal']
      },
      {
        displayName: 'Parmanand',
        primaryCity: 'Paramnanad',
        aliases: ['paramnanad', 'parmanand']
      },
      {
        displayName: 'Taragarh',
        primaryCity: 'Taragarh',
        aliases: ['taragarh', 'sidhwan']
      },
      {
        displayName: 'Barth Sahib',
        primaryCity: 'Barth Sahib',
        aliases: ['barth sahib']
      },
      {
        displayName: 'Sunderchak',
        primaryCity: 'Sunderchak',
        aliases: ['sunderchak']
      },
      {
        displayName: 'Jahkolri / Gharota',
        primaryCity: 'Jahkolri',
        aliases: ['jahkolri', 'gharota']
      },
      {
        displayName: 'Sarna',
        primaryCity: 'Sarna',
        aliases: ['sarna', 'kanwa']
      },
      {
        displayName: 'Pathankot City',
        primaryCity: 'PATHANKOT',
        aliases: ['pathankot']
      }
    ]
  },
  {
    id: 'corridor-dbn',
    name: 'Route 3: Gurdaspur ➔ Kalanaur ➔ Dera Baba Nanak (West)',
    shortName: 'Dera Baba Nanak Route',
    highway: 'Kalanaur-DBN Road',
    stops: [
      {
        displayName: 'Gazikot / Bakshiwal',
        primaryCity: 'Gazikot',
        aliases: ['gazikot', 'bakshiwal']
      },
      {
        displayName: 'Kalijpur',
        primaryCity: 'Kalijpur',
        aliases: ['kalijpur']
      },
      {
        displayName: 'Kalanaur',
        primaryCity: 'Kalanour',
        aliases: ['kalanour', 'kalanaur', 'gosal', 'naranwali']
      },
      {
        displayName: 'Kot Todar Mall',
        primaryCity: 'Kot Todar Mall',
        aliases: ['kot todar mall']
      },
      {
        displayName: 'Dera Baba Nanak',
        primaryCity: 'Dera Baba Nanak',
        aliases: ['dera baba nanak', 'dalam', 'dhandoi']
      },
      {
        displayName: 'Kotli Surat Malhi',
        primaryCity: 'Kotli Surat Malhi',
        aliases: ['kotli surat malhi', 'kotli', 'khaira kotli']
      },
      {
        displayName: 'Dehriwal',
        primaryCity: 'Dehriwal',
        aliases: ['dehriwal']
      }
    ]
  },
  {
    id: 'corridor-shri-hargobindpur',
    name: 'Route 4: Gurdaspur ➔ Kahnuwan ➔ Sri Hargobindpur (South-East)',
    shortName: 'Sri Hargobindpur Route',
    highway: 'Kahnuwan Road',
    stops: [
      {
        displayName: 'Tibri / Tibber',
        primaryCity: 'Tibri',
        aliases: ['tibri', 'tibber', 'mathola']
      },
      {
        displayName: 'Purana Shalla',
        primaryCity: 'Purana Shalla',
        aliases: ['purana shalla', 'gunopur', 'giderpindi']
      },
      {
        displayName: 'Kahnuwan',
        primaryCity: 'Kahnuwan',
        aliases: ['kahnuwan', 'jagowal', 'jakaria']
      },
      {
        displayName: 'Bhaini Mian Khan',
        primaryCity: 'Bhaini Mia Khan',
        aliases: ['bhaini mia khan', 'bhaini mian khan']
      },
      {
        displayName: 'Sathiali',
        primaryCity: 'Sathiali',
        aliases: ['sathiali']
      },
      {
        displayName: 'Sri Hargobindpur',
        primaryCity: 'Sri Hargobindpur',
        aliases: ['sri hargobindpur', 'shrihrgobinpur rd', 'bham', 'sahari', 'shadhowal']
      }
    ]
  },
  {
    id: 'corridor-behrampur',
    name: 'Route 5: Gurdaspur ➔ Dorangla ➔ Behrampur (Border Route)',
    shortName: 'Behrampur Border Route',
    highway: 'Trimmu Road',
    stops: [
      {
        displayName: 'Warsola',
        primaryCity: 'Warsola',
        aliases: ['warsola']
      },
      {
        displayName: 'Dorangla',
        primaryCity: 'Dorangla',
        aliases: ['dorangla', 'drongla']
      },
      {
        displayName: 'Behrampur',
        primaryCity: 'Behrampur',
        aliases: ['behrampur']
      },
      {
        displayName: 'Galhri / Marara',
        primaryCity: 'Galhri',
        aliases: ['galhri', 'marara']
      },
      {
        displayName: 'Chak Sharif',
        primaryCity: 'Chak Sharif',
        aliases: ['chak sharif', 'bhotoya', 'gajni']
      }
    ]
  },
  {
    id: 'corridor-qadian',
    name: 'Route 6: Dhariwal / Batala ➔ Qadian ➔ Ghuman (East Belt)',
    shortName: 'Qadian & Ghuman Route',
    highway: 'Qadian Road',
    stops: [
      {
        displayName: 'Qadian',
        primaryCity: 'Qadian',
        aliases: ['qadian', 'gogowal', 'maan kaur singh']
      },
      {
        displayName: 'Harchowal',
        primaryCity: 'Harchowal',
        aliases: ['harchowal']
      },
      {
        displayName: 'Ghuman / Nikke Ghuman',
        primaryCity: 'Ghuman',
        aliases: ['ghuman', 'nikke ghuman', 'chota ghumani', 'rasulpur']
      }
    ]
  }
];

function getCorridorsWithCounts(agents = []) {
  return CORRIDORS.map(corridor => {
    let totalAgents = 0;
    const stopsWithCounts = corridor.stops.map(stop => {
      const aliasSet = new Set(stop.aliases.map(a => a.toLowerCase().trim()));
      const count = agents.filter(a => {
        const c = (a.city || '').toLowerCase().trim();
        const ar = (a.area || '').toLowerCase().trim();
        return aliasSet.has(c) || aliasSet.has(ar);
      }).length;
      totalAgents += count;
      return {
        ...stop,
        agentCount: count
      };
    });

    return {
      ...corridor,
      totalAgents,
      stops: stopsWithCounts
    };
  });
}

function getAgentStopInfo(agent) {
  if (!agent) return null;
  const c = (agent.city || '').toLowerCase().trim();
  const ar = (agent.area || '').toLowerCase().trim();

  for (let rIdx = 0; rIdx < CORRIDORS.length; rIdx++) {
    const corridor = CORRIDORS[rIdx];
    for (let sIdx = 0; sIdx < corridor.stops.length; sIdx++) {
      const stop = corridor.stops[sIdx];
      const aliasSet = new Set(stop.aliases.map(a => a.toLowerCase().trim()));
      if (aliasSet.has(c) || aliasSet.has(ar)) {
        return {
          routeId: corridor.id,
          routeName: corridor.name,
          routeShortName: corridor.shortName,
          stopIndex: sIdx + 1,
          stopName: stop.displayName,
          primaryCity: stop.primaryCity
        };
      }
    }
  }

  return {
    routeId: 'other',
    routeName: 'Other Locations',
    routeShortName: 'Other',
    stopIndex: 99,
    stopName: agent.city || 'Other',
    primaryCity: agent.city || 'Other'
  };
}

function getRouteAliases(routeId) {
  const corridor = CORRIDORS.find(c => c.id === routeId);
  if (!corridor) return [];
  const aliases = new Set();
  corridor.stops.forEach(s => s.aliases.forEach(a => aliases.add(a)));
  return Array.from(aliases);
}

function getStopAliases(stopNameOrCity) {
  if (!stopNameOrCity) return [];
  const clean = stopNameOrCity.toLowerCase().trim();
  for (const c of CORRIDORS) {
    for (const s of c.stops) {
      if (s.displayName.toLowerCase().trim() === clean || s.primaryCity.toLowerCase().trim() === clean) {
        return s.aliases;
      }
      if (s.aliases.some(a => a === clean)) {
        return s.aliases;
      }
    }
  }
  return [clean];
}

module.exports = {
  CORRIDORS,
  getCorridorsWithCounts,
  getAgentStopInfo,
  getRouteAliases,
  getStopAliases
};
