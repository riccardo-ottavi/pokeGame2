export default function PlayerCard({ pokemon }){


    return(
        <>
            <h2>Pokemon Attivo</h2>
            <div className="card">
                
                <h3>{pokemon?.data?.name.toUpperCase()}</h3>
                <img src={pokemon?.data?.sprites?.front_default} alt="" />
                <p>Lv: {pokemon?.level}</p>
                <p></p>
            </div>
        </>
    )
}