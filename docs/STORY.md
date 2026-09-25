# How Kinma Movers came to life

## It started with a truck in Ikorodu

Kinma Movers began as a real business before it was an app: a Suzuki Carry mini truck based in Ikorodu, Lagos, moving household items, furniture and goods for people in the area. The owner knows how the work actually goes. They know the roads out of Ikorodu, what a fridge on a third floor really costs in time and effort, and which drivers in their own circle can be trusted with someone's property.

## The problem

Moving goods in Lagos still runs on phone calls and haggling. A customer who needs a sofa moved from Ikorodu to Lekki has to find a truck through someone who knows someone. Then they have to agree a price that changes with every conversation and hope the driver shows up. Big logistics companies are built for parcels and documents. Ride-hailing apps are built for people. The space in between is a single mattress, a shop's stock, or a whole flat. Nobody built that for the mini truck.

## The idea

Take what Uber and Bolt did for rides and do it for loads:

- a **customer** enters where, what and how big, and sees a fair price at once;
- a **driver** from a trusted network gets the job on their phone and accepts it;
- the **owner** sees every job, every driver and every naira in one place.

The owner's motto sets the promise: *No matter the size of load you wan move, your size of motto dey.*

## How it was built

The product was designed and built with the owner in one continuous conversation with Claude, an AI assistant, in September 2026.

1. **Prototype first.** A clickable prototype showed the customer booking flow and the driver's phone side by side. The owner could tap through a whole move before any real code existed.
2. **Pricing from real experience.** Ikorodu is the heart of the business, so every trip is priced by zone, measured outward from Ikorodu. The truck always comes home, so the farthest zone sets the fare. The owner set the real zone fares from their own knowledge of the market. Load size, loading helpers and floors of stairs at each end complete the quote.
3. **Real product, not a demo.** The owner was clear that this is a working product for real customers and real drivers. The first version therefore got proper security from day one. The server always recalculates prices. Drivers only see a customer's contact details after accepting a job. Every step of a trip is recorded.
4. **Smarter from the start.** Instead of waiting for "version 2", the first build added an AI assistant that turns a plain description ("2 bedroom flat, big fridge") into the right load size. It also added a matching engine that suggests the closest suitable driver, and a map for every trip.

## Where it's going

See [ROADMAP.md](ROADMAP.md) for the plan to make Kinma Movers different from anything built before it in Nigerian logistics.
